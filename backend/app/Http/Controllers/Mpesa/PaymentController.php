<?php

namespace App\Http\Controllers\Mpesa;

use App\Http\Controllers\Controller;
use App\Models\CheckInSession;
use App\Models\ParkingSlot;
use App\Models\Receipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function checkoutCallback(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('M-Pesa Checkout Callback', $payload);

        // Daraja wraps everything under Body.stkCallback
        $callback = data_get($payload, 'Body.stkCallback');

        if (!$callback) {
            Log::warning('M-Pesa callback missing stkCallback body', $payload);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        $resultCode       = (int) data_get($callback, 'ResultCode');
        $checkoutRequestId = data_get($callback, 'CheckoutRequestID');

        // Locate session by M-Pesa CheckoutRequestID
        $session = CheckInSession::where('mpesa_checkout_id', $checkoutRequestId)->first();

        if (!$session) {
            Log::error('No session found for CheckoutRequestID', ['id' => $checkoutRequestId]);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        // Payment failed on customer's side (e.g. cancelled, wrong PIN)
        if ($resultCode !== 0) {
            Log::warning('M-Pesa checkout payment failed', [
                'session'     => $session->session_id,
                'result_code' => $resultCode,
                'result_desc' => data_get($callback, 'ResultDesc'),
            ]);

            $session->update(['session_status' => 'payment_failed']);
            return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
        }

        // Extract M-Pesa metadata from callback items
        $items       = collect(data_get($callback, 'CallbackMetadata.Item', []));
        $mpesaCode   = $items->firstWhere('Name', 'MpesaReceiptNumber')['Value'] ?? null;
        $amountPaid  = (float) ($items->firstWhere('Name', 'Amount')['Value'] ?? 0);
        $phoneNumber = $items->firstWhere('Name', 'PhoneNumber')['Value'] ?? null;

        DB::transaction(function () use ($session, $mpesaCode, $amountPaid) {
            // Mark session as completed
            $session->update([
                'session_status' => 'completed',
                'mpesa_balance_ref' => $mpesaCode,
                'balance_paid' => $amountPaid
            ]);

            // Release the booking and slot
            if ($session->booking) {
                $session->booking->update(['booking_status' => 'completed']);
            };

            ParkingSlot::where('id', $session->slot_id)
                ->update(['status' => 'available']);

            // Generate receipt
            Receipt::create([
                'session_id'   => $session->id,
                'user_id'      => $session->user_id,
                'receipt_ref'  => 'RCP-' . strtoupper(substr($session->session_id, 0, 8)),
                'advance_ref'  => $session->booking ? $session->booking->mpesa_advance_ref : null,
                'balance_ref'  => $mpesaCode,
                'total_paid'   => round($session->advance_paid + $amountPaid, 2),
                'generated_at' => now(),
            ]);
        });

        Log::info('Checkout completed via M-Pesa callback', [
            'session'    => $session->session_id,
            'mpesa_code' => $mpesaCode,
        ]);

        return response()->json(['ResultCode' => 0, 'ResultDesc' => 'Accepted']);
    }
}
