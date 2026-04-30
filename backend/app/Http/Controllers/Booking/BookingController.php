<?php

namespace App\Http\Controllers\Booking;

use App\Models\Booking;
use App\Models\ParkingSlot;
use App\Models\PricingRule;
use App\Services\MpesaService;
use App\Services\SlotStatusTransitioner;
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
        $mpesaResponse = $this->mpesa->stkPush(
            $validated['phone'],
            $advanceFee,
            $booking->booking_reference
        );

        ExpireUnpaidBookings::dispatch()->delay(now()->addMinutes(5));

        return response()->json([
            'message'       => 'Booking created, complete payment on your phone',
            'booking'       => $booking,
            'advance_fee'   => $advanceFee,
            'estimated_total' => $totalCost,
        ], 201);
    }
}
