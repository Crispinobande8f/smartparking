<?php

namespace App\Http\Controllers\Mpesa;

use App\Http\Controllers\Controller;
use App\Models\CheckInSession;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    /**
     * GET /v1/sessions/{id}/receipt
     *
     * Returns the full session summary for a completed session.
     */
    public function show(Request $request, string $sessionId): JsonResponse
    {
        $session = CheckInSession::with(['booking', 'slot', 'user', 'receipt'])
            ->where('session_id', $sessionId)
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        // Only owner or admin may view
        if (
            $session->user_id !== $request->user()->id &&
            !$request->user()->hasRole('admin')
        ) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($session->session_status !== 'completed') {
            return response()->json(['message' => 'Receipt is only available for completed sessions.'], 422);
        }

        $checkinTime  = Carbon::parse($session->checkin_time);
        $checkoutTime = Carbon::parse($session->checkout_time);

        return response()->json([
            'receipt_ref'   => optional($session->receipt)->receipt_ref,
            'session_id'    => $session->session_id,

            // Slot info
            'slot' => [
                'number' => optional($session->slot)->slot_number,
                'type'   => optional($session->slot)->slot_type,
                'location'  => optional($session->slot)->location_description,
            ],
            'checkin_time'       => $checkinTime->toIso8601String(),
            'checkout_time'      => $checkoutTime->toIso8601String(),
            'total_duration_minutes' => $session->total_duration,

            // Fee breakdown
            'fees' => [
                'base_fee'    => (float) $session->base_fee,
                'late_fee'    => (float) $session->late_fee,
                'total_fee'   => (float) $session->total_fee,
                'advance_paid'=> (float) $session->advance_paid,
                'balance_paid'=> (float) $session->balance_paid,
            ],

            // M-Pesa codes
            'payments' => [
                'advance_mpesa_ref' => optional($session->receipt)->advance_ref  ?? optional($session->booking)->mpesa_advance_ref,
                'balance_mpesa_ref' => optional($session->receipt)->balance_ref  ?? $session->mpesa_balance_ref,
            ],

            // Driver info (non-sensitive)
            'driver' => [
                'name'  => optional($session->user)->name,
                'email' => optional($session->user)->email,
            ],

            'generated_at' => now()->toIso8601String(),
        ]);
    }
}
