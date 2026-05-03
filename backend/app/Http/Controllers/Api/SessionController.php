<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CheckInSession;
use App\Models\ParkingSlot;
use App\Models\Receipt;
use App\Services\BillingService;
use App\Services\MpesaService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    public function __construct(
        private BillingService $billing,
        private MpesaService   $mpesa
    ) {}

    // ------------------------------------------------------------------ //
    //  POST /v1/sessions/checkin
    // ------------------------------------------------------------------ //
    public function checkin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_reference' => ['required', 'string'],
        ]);

        // 1. Resolve booking
        $booking = Booking::with('slot')
            ->where('booking_reference', $data['booking_reference'])
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'Booking not found.'], 404);
        }

        // 2. Confirm booking belongs to authenticated user (or attendant override — handled in AttendantController)
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'This booking does not belong to you.'], 403);
        }

        // 3. Status must be 'confirmed'
        if ($booking->booking_status !== 'confirmed') {
            return response()->json([
                'message' => "Cannot check in — booking status is '{$booking->booking_status}'.",
            ], 422);
        }

        // 4. Arrival window: within ±30 minutes of expected_arrival
        $now             = Carbon::now();
        $expectedArrival = Carbon::parse($booking->expected_arrival);
        $windowStart     = $expectedArrival->copy()->subMinutes(30);
        $windowEnd       = $expectedArrival->copy()->addMinutes(30);

        if ($now->lt($windowStart) || $now->gt($windowEnd)) {
            return response()->json([
                'message'          => 'Outside allowed check-in window (±30 min of expected arrival).',
                'expected_arrival' => $expectedArrival->toIso8601String(),
                'window_start'     => $windowStart->toIso8601String(),
                'window_end'       => $windowEnd->toIso8601String(),
                'server_time'      => $now->toIso8601String(),
            ], 422);
        }

        // 5. No duplicate active session
        $existing = CheckInSession::where('booking_id', $booking->id)
            ->whereNull('checkout_time')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'An active session already exists for this booking.'], 409);
        }

        // 6. Atomic: create session, update booking + slot
        $session = DB::transaction(function () use ($booking, $now) {
            $session = CheckInSession::create([
                'session_id'   => Str::uuid(),
                'booking_id'   => $booking->id,
                'user_id'      => $booking->user_id,
                'slot_id'      => $booking->slot_id,
                'checkin_time' => $now,
                'advance_paid' => $booking->advance_fee_paid,
                'session_status'=>'active',
            ]);

            $booking->update(['booking_status' => 'checked_in']);

            ParkingSlot::where('id', $booking->slot_id)
                ->update(['status' => 'occupied']);

            return $session;
        });

        return response()->json([
            'message'      => 'Check-in successful.',
            'session_id'   => $session->session_id,
            'slot'         => $booking->slot->slot_number ?? $booking->slot_id,
            'checkin_time' => $session->checkin_time->toIso8601String(),
            'expected_departure' => Carbon::parse($booking->expected_departure)->toIso8601String(),
        ], 201);
    }

    // ------------------------------------------------------------------ //
    //  GET /v1/sessions/active
    // ------------------------------------------------------------------ //
    public function activeSession(Request $request): JsonResponse
    {
        $session = CheckInSession::with(['booking', 'slot'])
            ->where('user_id', $request->user()->id)
            ->whereNull('checkout_time')
            ->latest('checkin_time')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'No active session found.'], 404);
        }

        $checkinTime  = Carbon::parse($session->checkin_time);
        $elapsedMins  = (int) $checkinTime->diffInMinutes(Carbon::now());

        return response()->json([
            'session_id'             => $session->session_id,
            'slot'                   => optional($session->slot)->slot_number,
            'slot_type'              => optional($session->slot)->type,
            'checkin_time'           => $checkinTime->toIso8601String(),
            'elapsed_minutes'        => $elapsedMins,
            'booked_departure_time'  => optional($session->booking)->expected_departure,
            'is_overtime'            => $this->isOvertime($session),
        ]);
    }

    // ------------------------------------------------------------------ //
    //  GET /v1/sessions/{id}/checkout-preview
    // ------------------------------------------------------------------ //
    public function initiateCheckout(string $sessionId): JsonResponse
    {
        $session = $this->resolveActiveSession($sessionId);
        if ($session instanceof JsonResponse) return $session;

        $breakdown = $this->billing->calculate($session);

        return response()->json([
            'session_id'             => $session->session_id,
            'checkin_time'           => Carbon::parse($session->checkin_time)->toIso8601String(),
            'preview_time'           => Carbon::now()->toIso8601String(),
            'total_duration_minutes' => $breakdown['total_duration_minutes'],
            'base_fee'               => $breakdown['base_fee'],
            'late_fee'               => $breakdown['late_fee'],
            'total_fee'              => $breakdown['total_fee'],
            'advance_paid'           => $breakdown['advance_paid'],
            'balance_due'            => $breakdown['balance_due'],
            'is_overtime'            => $breakdown['is_overtime'],
        ]);
    }

    // ------------------------------------------------------------------ //
    //  POST /v1/sessions/{id}/checkout
    // ------------------------------------------------------------------ //
    public function confirmCheckout(Request $request, string $sessionId): JsonResponse
    {
        $session = $this->resolveActiveSession($sessionId);
        if ($session instanceof JsonResponse) return $session;

        $checkoutTime = Carbon::now();
        $breakdown    = $this->billing->calculate($session);

        // Persist final billing + checkout timestamp inside a transaction
        DB::transaction(function () use ($session, $checkoutTime, $breakdown) {
            $session->update([
                'checkout_time'  => $checkoutTime,
                'total_duration' => $breakdown['total_duration_minutes'],
                'base_fee'       => $breakdown['base_fee'],
                'late_fee'       => $breakdown['late_fee'],
                'total_fee'      => $breakdown['total_fee'],
                'advance_paid'   => $breakdown['advance_paid'],
                'balance_paid' => $breakdown['balance_due'],
            ]);
        });

        // Zero-balance path: no M-Pesa needed
        if ($breakdown['balance_due'] <= 0) {
            return $this->completeSessionAndRelease($session, $breakdown, checkoutTime: $checkoutTime);
        }

        // Balance owed: trigger STK Push
        try {
            $user  = $session->user ?? $request->user();
            $phone = $user->phone_number; // e.g. "2547XXXXXXXX"

            $mpesaResponse = $this->mpesa->stkPush(
                phone:       $phone,
                amount:      $breakdown['balance_due'],
                accountRef:  $session->session_id,
                description: 'Parking Balance'
            );

            $session->update([
                'session_status' => 'awaiting_payment',
                'mpesa_checkout_id'   => $mpesaResponse['CheckoutRequestID'] ?? null,
            ]);

            return response()->json([
                'message'               => 'STK Push sent. Awaiting payment confirmation.',
                'session_id'            => $session->session_id,
                'checkout_request_id'   => $mpesaResponse['CheckoutRequestID'] ?? null,
                'billing'               => $breakdown,
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Checkout recorded but M-Pesa push failed. Please retry.',
                'error'   => $e->getMessage(),
                'billing' => $breakdown,
            ], 502);
        }
    }

    // ------------------------------------------------------------------ //
    //  Helpers
    // ------------------------------------------------------------------ //
    private function resolveActiveSession(string $sessionId): CheckInSession|JsonResponse
    {
        $session = CheckInSession::with(['booking', 'slot', 'user'])
            ->where('session_id', $sessionId)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        if ($session->checkout_time) {
            return response()->json(['message' => 'Session is already checked out.'], 409);
        }

        return $session;
    }

    private function completeSessionAndRelease(
        CheckInSession $session,
        array $breakdown,
        Carbon $checkoutTime
    ): JsonResponse {
        DB::transaction(function () use ($session) {
            $session->update(['status' => 'completed']);
            $session->booking?->update(['booking_status' => 'completed']);
            ParkingSlot::where('id', $session->slot_id)->update(['status' => 'available']);

            Receipt::create([
                'session_id'   => $session->id,
                'user_id'      => $session->user_id,
                'receipt_ref'  => 'RCP-' . strtoupper(substr($session->session_id, 0, 8)),
                'advance_ref'  => $session->booking?->mpesa_advance_ref,
                'balance_ref'  => null, // No balance payment
                'total_paid'   => $session->advance_paid,
                'generated_at' => now(),
                'session_status' => 'completed'
            ]);
        });

        return response()->json([
            'message'     => 'Checkout complete. No balance due.',
            'session_id'  => $session->session_id,
            'billing'     => $breakdown,
            'checkout_at' => $checkoutTime->toIso8601String(),
        ]);
    }

    private function isOvertime(CheckInSession $session): bool
    {
        if (!$session->booking) return false;
        $slotType = optional($session -> slot)->slot_type ?? 'standard';

        try{
            $rule = \App\Models\PricingRule::getForSlotType($slotType);
            $gracePeriod = $rule->grace_period_minutes;
        } catch(\Throwable){
            $gracePeriod = 0;
        }

        $expectedDeparture = Carbon::parse($session->booking->expected_departure);
        return Carbon::now()->gt($expectedDeparture->addMinutes(BillingService::GRACE_PERIOD_MIN));
    }
}
