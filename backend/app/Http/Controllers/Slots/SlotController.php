<?php

namespace App\Http\Controllers\Slots;

use App\Http\Controllers\Controller;
use App\Models\ParkingSlot;
use App\Models\PricingRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SlotController extends Controller
{
    public function index(): JsonResponse
    {
        $rules = PricingRule::where('is_active', true)
            ->get()
            ->keyBy('slot_type');

        $slots = ParkingSlot::all()->map(function ($slot) use ($rules) {
            $rule = $rules->get($slot->slot_type);
            $rate = $rule ? (float) $rule->hourly_rate : 100;

            return [
                'id'  => $slot->id,
                'slot_number' => $slot->slot_number,
                'slot_type' => $slot->slot_type,
                'status' => $slot->status,
                'zone' => strtoupper($slot->slot_number[0]),
                'hourly_rate' => $rate,
                'location_description' => $slot->location_description,
            ];
        });

        return response()->json($slots);
    }

    public function show(ParkingSlot $slot): JsonResponse
    {
        $slot->load('activeBooking');

        $rule = PricingRule::where('slot_type', $slot->slot_type)
            ->where('is_active', true)
            ->first();

        return response()->json(array_merge($slot->toArray(), [
            'hourly_rate' => $rule ? (float) $rule->hourly_rate : 100,
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slot_number'          => 'required|string|unique:parking_slots,slot_number',
            'slot_type'            => 'required|in:standard,disabled,VIP,premium,economy',
            'status'               => 'sometimes|in:available,reserved,occupied,maintenance',
            'location_description' => 'nullable|string',
        ]);

        $slot = ParkingSlot::create($validated);

        $rule = PricingRule::where('slot_type', $slot->slot_type)
            ->where('is_active', true)
            ->first();

        return response()->json([
            'message' => 'Parking slot created successfully',
            'slot'    => array_merge($slot->toArray(), [
                'hourly_rate' => $rule ? (float) $rule->hourly_rate : 100,
            ]),
        ], 201);
    }

    public function update(Request $request, ParkingSlot $slot): JsonResponse
    {
       $validated = $request->validate([
            'slot_number'          => 'sometimes|string|unique:parking_slots,slot_number,' . $slot->id,
            'slot_type'            => 'sometimes|in:standard,disabled,VIP,premium,economy',
            'status'               => 'sometimes|in:available,reserved,occupied,maintenance',
            'location_description' => 'nullable|string',
        ]);

        $slot->update($validated);
        $fresh = $slot->fresh();

        $rule = PricingRule::where('slot_type', $fresh->slot_type)
            ->where('is_active', true)
            ->first();

        return response()->json([
            'message' => 'Parking slot updated',
            'slot'    => array_merge($fresh->toArray(), [
                'hourly_rate' => $rule ? (float) $rule->hourly_rate : 100,
            ]),
        ]);
    }

    public function destroy(ParkingSlot $slot): JsonResponse
    {
        $slot->update(['status' => 'maintenance']);
        return response()->json(['message' => 'Slot deactivated']);
    }
}
