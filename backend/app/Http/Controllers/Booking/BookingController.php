<?php

namespace App\Http\Controllers\Booking;

use App\Models\Booking;
use App\Models\ParkingSlot;
use App\Models\PricingRule;
use App\Services\MpesaService;
use App\Services\SlotStatusTransitioner;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use App\Jobs\ExpireUnpaidBookings;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class BookingController extends Controller
{
    private $transitioner;
    private $mpesa;

    public function __construct(SlotStatusTransitioner $transitioner, MpesaService $mpesa)
    {
        $this->transitioner = $transitioner;
        $this->mpesa        = $mpesa;
    }

    public function quote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slot_id' => 'required|integer|exists:parking_slots,id',
            'hours'   => 'required|integer|min:1|max:24',
        ]);

        $slot = ParkingSlot::findOrFail($validated['slot_id']);

        $rule = PricingRule::where('slot_type', $slot->slot_type)
            ->where('is_active', true)
            ->first();

        if (!$rule) {
            return response()->json(['message' => 'No pricing rule for slot type: ' . $slot->slot_type], 422);
        }

        $totalCost  = $validated['hours'] * $rule->hourly_rate;
        $advanceFee = round($totalCost * $rule->advance_payment_percentage, 2);

        return response()->json([
            'slot_id'      => $slot->id,
            'slot_type'    => $slot->slot_type,
            'hourly_rate'  => $rule->hourly_rate,
            'hours'        => $validated['hours'],
            'total_cost'   => $totalCost,
            'advance_fee'  => $advanceFee,
            'advance_pct'  => $rule->advance_payment_percentage * 100 . '%',
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slot_id'            => 'required|integer|exists:parking_slots,id',
            'phone'              => 'required|string|regex:/^07\d{8}$/',
            'expected_arrival'   => 'required|date|after:now',
            'expected_departure' => 'required|date|after:expected_arrival',
        ]);

        $slot = ParkingSlot::findOrFail($validated['slot_id']);

        if ($slot->status !== 'available') {
            return response()->json([
                'message' => 'Slot is not available for booking',
            ], 422);
        }

        // Step 1 — Calculate advance fee from pricing rules
        $rule = PricingRule::where('slot_type', $slot->slot_type)
            ->where('is_active', true)
            ->firstOrFail();

        $arrival    = \Carbon\Carbon::parse($validated['expected_arrival']);
        $departure  = \Carbon\Carbon::parse($validated['expected_departure']);
        $hours      = ceil($arrival->diffInMinutes($departure) / 60);
        $totalCost  = $hours * $rule->hourly_rate;
        $advanceFee = round($totalCost * $rule->advance_payment_percentage, 2);

        Log::info('Booking price calculated', [
            'slot_type'   => $slot->slot_type,
            'hours'       => $hours,
            'hourly_rate' => $rule->hourly_rate,
            'total_cost'  => $totalCost,
            'advance_fee' => $advanceFee,
        ]);


        // Step 2 — Create booking with pending status and calculated fee
        $booking = Booking::create([
            'user_id'           => auth()->id(),
            'slot_id'           => $validated['slot_id'],
            'booking_reference' => 'BK-' . strtoupper(uniqid()),
            'booking_time'      => now(),
            'expected_arrival'  => $validated['expected_arrival'],
            'expected_departure'=> $validated['expected_departure'],
            'advance_fee_paid'  => 0,
            'booking_status'    => 'pending',
        ]);

        //Step 3 — Transition slot to reserved
        $this->transitioner->transition(
            $slot,
            'reserved',
            'Booking ' . $booking->booking_reference
        );

        //Step 4 — Initiate STK push with calculated fee
        try{
            $mpesaResponse = $this->mpesa->stkPush(
                $validated['phone'],
                $advanceFee,
                $booking->booking_reference
            );

            $booking->update([
                'mpesa_checkout_id' => $mpesaResponse['CheckoutRequestID'] ?? null,
            ]);
        }catch (\Exception $e) {
            // Roll back slot and booking so the user can try again
            $booking->update(['booking_status' => 'cancelled']);
            $this->transitioner->transition(
                $slot,
                'available',
                'STK push failed for ' . $booking->booking_reference
            );

            Log::error('STK push failed — booking rolled back', [
                'booking_ref' => $booking->booking_reference,
                'error'       => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Payment initiation failed: ' . $e->getMessage(),
            ], 422);
        }


        ExpireUnpaidBookings::dispatch()->delay(now()->addMinutes(5));

        return response()->json([
            'message'       => 'Booking created, complete payment on your phone',
            'booking'       => $booking,
            'advance_fee'   => $advanceFee,
            'estimated_total' => $totalCost,
        ], 201);
    }

    public function show(string $booking): JsonResponse
    {
        $record = Booking::where('booking_reference', $booking)
            ->firstOrFail();

        return response()->json([
            'booking' => [
                'booking_reference' => $record->booking_reference,
                'booking_status'    => $record->booking_status,
                'driver_name' => $record->user->name,
                'slot_number'        => $record->slot->slot_number,
                'slot_type'          => $record->slot->slot_type,
                'expected_arrival'   => $record->expected_arrival,
                'expected_departure' => $record->expected_departure,
                'advance_fee_paid'   => (float) $record->advance_fee_paid,
                'mpesa_checkout_id'  => $record->mpesa_checkout_id,
                'created_at'         => $record->created_at,
            ]
        ]);
    }
}
