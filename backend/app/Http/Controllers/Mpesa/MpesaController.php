<?php

namespace App\Http\Controllers\Mpesa;

use App\Models\Booking;
use App\Models\ParkingSlot;
use App\Services\SlotStatusTransitioner;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class MpesaCallbackController extends Controller
{
    private $transitioner;

    public function __construct(SlotStatusTransitioner $transitioner)
    {
        $this->transitioner = $transitioner;
    }

    public function handle(Request $request)
    {
        $data       = $request->all();
        $callback   = $data['Body']['stkCallback'];
        $resultCode = $callback['ResultCode'];

        //Extract booking reference and amount from callback metadata
        $metadata  = collect($callback['CallbackMetadata']['Item'] ?? []);
        $reference = $metadata->firstWhere('Name', 'AccountReference')['Value'] ?? null;
        $amountPaid= $metadata->firstWhere('Name', 'Amount')['Value'] ?? 0;

        if (!$reference) {
            return response()->json(['message' => 'Invalid callback'], 400);
        }

        $booking = Booking::where('booking_reference', $reference)->first();

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ($resultCode === 0) {
            //Payment successful — record actual fee paid and confirm booking
            $booking->update([
                'advance_fee_paid' => $amountPaid,      //record what was actually paid
                'booking_status'   => 'confirmed',
            ]);
        } else {
            //Payment failed — cancel booking and free the slot
            $booking->update(['booking_status' => 'cancelled']);

            $slot = ParkingSlot::find($booking->slot_id);
            if ($slot) {
                $this->transitioner->transition(
                    $slot,
                    'available',
                    'Payment failed for ' . $reference  //slot freed back
                );
            }
        }

        return response()->json(['message' => 'Callback received'], 200);
    }
}
