<?php

namespace App\Http\Controllers\Slots;

use App\Models\ParkingSlot;
use App\Services\SlotStatusTransitioner;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SlotStatusController extends Controller
{
    private $transitioner;                                          // ✅ no type hint on property

    public function __construct(SlotStatusTransitioner $transitioner)
    {
        $this->transitioner = $transitioner;
    }

    public function transition(Request $request, ParkingSlot $slot)
    {
        $validated = $request->validate([
            'status' => 'required|in:available,reserved,occupied,maintenance',
            'reason' => 'nullable|string',
        ]);

        try {
            $slot = $this->transitioner->transition(
                $slot,
                $validated['status'],
                $validated['reason'] ?? null
            );

            return response()->json([
                'message' => 'Status updated',
                'slot'    => $slot,
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function history(ParkingSlot $slot)
    {
        $logs = $slot->auditLogs()
            ->with('user:id,name,email')
            ->orderBy('changed_at', 'desc')
            ->get();

        return response()->json($logs);
    }
}
