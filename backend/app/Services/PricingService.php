<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\PricingRule;
use Illuminate\Support\Carbon;

class PricingService
{
    public function calculate(Booking $booking): array
    {
        $rule        = PricingRule::getForSlotType($booking->slot->slot_type);
        $bookingTime = Carbon::parse($booking->started_at);
        $timeNow     = Carbon::now();
        $minutesUsed = $timeNow->diffInMinutes($bookingTime);
        $minutesLate = max(0, $minutesUsed - $rule->grace_period_minutes);

        $hoursCharged  = ceil($minutesUsed / 60);
        $baseCost      = $hoursCharged * $rule->hourly_rate;
        $advanceAmount = $baseCost * $rule->advance_payment_percentage;

        $lateFee = 0;
        if ($minutesLate > 0) {
            $lateFee = ceil($minutesLate / 60) * $rule->late_fee_per_hour;
        }

        return [
            'hours_charged'   => $hoursCharged,
            'base_cost'       => round($baseCost, 2),
            'advance_amount'  => round($advanceAmount, 2),
            'late_fee'        => round($lateFee, 2),
            'total'           => round($baseCost + $lateFee, 2),
            'grace_period'    => $rule->grace_period_minutes,
            'minutes_late'    => $minutesLate,
        ];
    }
}
