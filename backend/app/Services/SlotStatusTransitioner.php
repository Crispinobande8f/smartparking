<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\ParkingSlot;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class SlotStatusTransitioner
{
    private const VALID_TRANSITIONS = [
        'available'   => ['reserved', 'maintenance'],
        'reserved'    => ['occupied', 'available'],
        'occupied'    => ['available', 'maintenance'],
        'maintenance' => ['available'],
    ];

    public function transition(ParkingSlot $slot, string $toStatus, ?string $reason = null): ParkingSlot
    {
        $fromStatus = $slot->status;

        if (!$this->isValidTransition($fromStatus, $toStatus)) {
            throw new \InvalidArgumentException(
                "Invalid transition from '{$fromStatus}' to '{$toStatus}'"
            );
        }

        $slot->update(['status' => $toStatus]);

        AuditLog::create([
            'parking_slot_id' => $slot->id,
            'user_id'         => Auth::id(),
            'from_status'     => $fromStatus,
            'to_status'       => $toStatus,
            'reason'          => $reason,
            'changed_at'      => Carbon::now(),
        ]);

        return $slot->fresh();
    }

    private function isValidTransition(string $from, string $to): bool
    {
        return in_array($to, self::VALID_TRANSITIONS[$from] ?? []);
    }
}
