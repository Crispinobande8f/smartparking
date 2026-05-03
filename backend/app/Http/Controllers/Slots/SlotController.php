<?php

namespace App\Http\Controllers\Slots;

use App\Models\ParkingSlot;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SlotController extends Controller
{
    public function index(Request $request)
    {
       $slots = ParkingSlot::where('is_active', true)
        ->select([
            'id',
            'slot_number',
            'slot_type',
            'status',
            'hourly_rate',
            'location_description',
        ])
        ->orderBy('slot_number')
        ->get();
       return response()->json($slots);
    }

    public function show(ParkingSlot $slot)
    {
        $slot -> load('activeBooking');
        return response()->json($slot);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'slot_number' => 'required|string|unique:parking_slots,slot_number',
            'slot_type' => 'required|in:standard,disabled,VIP',
            'status' => 'sometimes|in:available,reserved,occupied,maintenance',
            'hourly_rate'=>'required|numeric|min:0',
            'location_description' => 'nullable|string',
        ]);

        $slot = ParkingSlot::create($validated);

        return response() -> json([
            'message'=>'Parking slot created successfully....',
            'slot' => $slot
        ], 201);
    }

    public function update(Request $request, ParkingSlot $slot)
    {
        $validated = $request->validate([
            'slot_number' => 'sometimes|string|unique:parking_slots,slot_number,'.$slot->id,
            'slot_type' => 'sometimes|in:standard,disabled,VIP',
            'status' => 'sometimes|in:available,reserved,occupied,maintenance',
            'hourly_rate'=>'sometimes|numeric|min:0',
            'location_description' => 'nullable|string',
        ]);

        $slot ->update($validated);

        return response()-> json([
            'message'=>'Parking slot updated',
            'slot'=> $slot->fresh(),
        ], 200);

    }

    public function destroy(ParkingSlot $slot)
    {
        $slot -> update(['status'=>'maintenance']);
        return response()-> json([
            'message'=>'Slot deactivated',
        ]);
    }
}
