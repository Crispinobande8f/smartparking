<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Models\ParkingSlot;
use App\Services\SlotStatusTransitioner;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExpireUnpaidBookings implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(SlotStatusTransitioner $transitioner): void
    {
        //Find all pending bookings older than 5 minutes
        $expiredBookings = Booking::where('booking_status', 'pending')
            ->where('booking_time', '<=', now()->subMinutes(5))
            ->get();

        foreach ($expiredBookings as $booking) {
            // Cancel the booking
            $booking->update(['booking_status' => 'cancelled']);

            // Release the slot back to available
            $slot = ParkingSlot::find($booking->slot_id);

            if ($slot && $slot->status === 'reserved') {
                $transitioner->transition(
                    $slot,
                    'available',
                    'Booking ' . $booking->booking_reference . ' expired — payment not received'
                );
            }

            Log::info('Booking expired', [
                'booking_reference' => $booking->booking_reference,
                'slot_id'           => $booking->slot_id,
                'expired_at'        => now(),
            ]);
        }
    }
}
