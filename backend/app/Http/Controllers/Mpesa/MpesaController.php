<?php

namespace App\Http\Controllers\Mpesa;

use App\Models\Booking;
use App\Models\ParkingSlot;
use App\Services\SlotStatusTransitioner;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    private $transitioner;

    public function __construct(SlotStatusTransitioner $transitioner)
    {
        $this->transitioner = $transitioner;
    }

    public function handle(Request $request)
    {
        Log::info('M-Pesa STK Callback received', $request->all());

        $callback = $request->input('Body.stkCallback');

        if (!$callback) {
            Log::warning('M-Pesa callback missing stkCallback body');
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        $resultCode = (int) $callback['ResultCode'];
        $checkoutId = $callback['CheckoutRequestID'] ?? null;

        if (!$checkoutId) {
            Log::warning('M-Pesa callback missing CheckoutRequestID');
            return response()->json(['message' => 'Missing CheckoutRequestID'], 400);
        }

        $booking = Booking::where('mpesa_checkout_id', $checkoutId)->first();

        if (!$booking) {
            Log::error('No booking found for CheckoutRequestID', ['checkout_id' => $checkoutId]);
            // Still return 200 — Safaricom will keep retrying on non-200 responses
            return response()->json(['message' => 'Booking not found'], 200);
        }

        if ($resultCode === 0) {
            // Payment successful — metadata only present on success
            $metadata   = collect($callback['CallbackMetadata']['Item'] ?? []);
            $amountPaid = $metadata->firstWhere('Name', 'Amount')['Value'] ?? 0;
            $mpesaRef   = $metadata->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;

            $booking->update([
                'advance_fee_paid'  => $amountPaid,
                'booking_status'    => 'confirmed',
                'mpesa_advance_ref' => $mpesaRef,
            ]);

            Log::info('Booking confirmed via M-Pesa', [
                'booking_ref' => $booking->booking_reference,
                'mpesa_ref'   => $mpesaRef,
                'amount'      => $amountPaid,
            ]);
        } else {
            // Payment failed/cancelled — free the slot back
            $booking->update(['booking_status' => 'cancelled']);

            $slot = ParkingSlot::find($booking->slot_id);
            if ($slot) {
                $this->transitioner->transition(
                    $slot,
                    'available',
                    'Payment failed for ' . $booking->booking_reference
                );
            }

            Log::warning('Booking cancelled — M-Pesa payment failed', [
                'booking_ref' => $booking->booking_reference,
                'result_code' => $resultCode,
                'result_desc' => $callback['ResultDesc'] ?? 'unknown',
            ]);
        }

        // Always return 200 — Safaricom expects this to stop retrying
        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }
}
