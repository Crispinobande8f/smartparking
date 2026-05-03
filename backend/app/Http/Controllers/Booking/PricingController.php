<?php

namespace App\Http\Controllers\Booking;

use App\Models\PricingRule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class PricingController extends Controller
{
    // GET /pricing-rules
    public function index(): JsonResponse
    {
        $rules = PricingRule::where('is_active', true)->get();

        return response()->json($rules);
    }

    // POST /pricing-rules
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'slot_type' => 'required|in:standard,disabled,VIP',
            'hourly_rate' => 'required|numeric|min:0',
            'late_fee_per_hour' => 'required|numeric|min:0',
            'advance_payment_percentage' => 'required|numeric|min:0|max:1',
            'grace_period_minutes' => 'required|integer|min:0',
        ]);

        $rule = PricingRule::create($validated);

        return response()->json([
            'message' => 'Pricing rule created',
            'rule'    => $rule,
        ], 201);
    }

    // PUT /pricing-rules/{rule}
    public function update(Request $request, PricingRule $rule): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'slot_type'   => 'sometimes|in:standard,disabled,VIP',
            'hourly_rate' => 'sometimes|numeric|min:0',
            'late_fee_per_hour' => 'sometimes|numeric|min:0',
            'advance_payment_percentage' => 'sometimes|numeric|min:0|max:1',
            'grace_period_minutes' => 'sometimes|integer|min:0',
        ]);

        $rule->update($validated);

        return response()->json([
            'message' => 'Pricing rule updated',
            'rule'    => $rule->fresh(),
        ]);
    }

    // DELETE /pricing-rules/{rule}
    public function destroy(PricingRule $rule): JsonResponse
    {
        $rule->update(['is_active' => false]);   // soft deactivate, never hard delete rules

        return response()->json([
            'message' => 'Pricing rule deactivated',
        ]);
    }
}
