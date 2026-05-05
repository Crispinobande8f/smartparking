<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CheckInSession;
use App\Models\ParkingSlot;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AttendantController extends Controller
{

    public function assistCheckin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_reference' => ['required', 'string'],
        ]);

        // 1. Resolve booking with slot
        $booking = Booking::with('slot')
            ->where('booking_reference', $data['booking_reference'])
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'Booking not found.'], 404);
        }

        // 2. Status must be 'confirmed'
        if ($booking->booking_status !== 'confirmed') {
            return response()->json([
                'message' => "Cannot check in — booking status is '{$booking->booking_status}'.",
            ], 422);
        }

        // 3. Arrival window: ±30 minutes of expected_arrival
        //    Attendant still respects the window — they cannot check someone
        //    in hours early or long after they were expected.
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

        // 4. No duplicate active session
        $existing = CheckInSession::where('booking_id', $booking->id)
            ->whereNull('checkout_time')
            ->first();

        if ($existing) {
            return response()->json([
                'message'    => 'An active session already exists for this booking.',
                'session_id' => $existing->session_id,
            ], 409);
        }

        // 5. Atomic: create session, update booking + slot
        $session = DB::transaction(function () use ($booking, $now, $request) {
            $session = CheckInSession::create([
                'session_id'     => Str::uuid(),
                'booking_id'     => $booking->id,
                'user_id'        => $booking->user_id,  // belongs to the driver, not the attendant
                'slot_id'        => $booking->slot_id,
                'checkin_time'   => $now,
                'advance_paid'   => $booking->advance_fee_paid,
                'session_status' => 'active',
                // Record which attendant performed the check-in for audit purposes
                'checked_in_by'  => $request->user()->id,
            ]);

            $booking->update(['booking_status' => 'checked_in']);

            ParkingSlot::where('id', $booking->slot_id)
                ->update(['status' => 'occupied']);

            return $session;
        });

        return response()->json([
            'message'            => 'Check-in successful (attendant assisted).',
            'session_id'         => $session->session_id,
            'slot'               => $booking->slot->slot_number ?? $booking->slot_id,
            'driver_user_id'     => $booking->user_id,
            'attendant_id'       => $request->user()->id,
            'checkin_time'       => $session->checkin_time->toIso8601String(),
            'expected_departure' => Carbon::parse($booking->expected_departure)->toIso8601String(),
            'advance_paid'       => (float) $booking->advance_fee_paid,
        ], 201);
    }

    public function activeSessions(): JsonResponse
    {
        $sessions = CheckInSession::with(['booking', 'slot', 'user'])
            ->whereNull('checkout_time')
            ->where('session_status', 'active')
            ->latest('checkin_time')
            ->get()
            ->map(fn($s) => [
                'id'            => $s->id,
                'session_id'    => $s->session_id,
                'booking_reference' => $s->booking?->booking_reference,
                'plate'         => $s->booking?->vehicle_plate,
                'driver_name'   => $s->user?->name,
                'slot'          => $s->slot?->slot_number,
                'zone'          => strtoupper($s->slot?->slot_number[0] ?? ''),
                'checkin_time'  => $s->checkin_time,
                'hourly_rate'   => $s->slot
                    ? (float) optional(\App\Models\PricingRule::where('slot_type', $s->slot->slot_type)->where('is_active', true)->first())->hourly_rate ?? 100
                    : 100,
                'advance_paid'  => (float) $s->advance_paid,
                'checkout_requested' => $s->session_status === 'awaiting_payment',
            ]);

        return response()->json($sessions);
    }
}
