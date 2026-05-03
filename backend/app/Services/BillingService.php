<?php

namespace App\Services;

use App\Models\CheckInSession;
use App\Models\PricingRule;
use Carbon\Carbon;

class BillingService
{
    public function calculate(CheckInSession $session):array
    {
        $session->loadMissing(['booking','slot']);

        $slot = $session->slot;
        $slotType = isset($slot->slot_type) ? $slot->slot_type : 'standard';

        $rule = PricingRule::getForSlotType($slotType);

        $checkinTime = Carbon::parse($session->checkin_time);
        $reference_time = $session->checkout_time
            ? Carbon::parse($session->checkout_time)
            : Carbon::now();

        $totalMinutes = (int) $checkinTime->diffInMinutes($reference_time);
        $booking = $session->booking;
        $bookedMinutes = $booking
            ?(int) Carbon::parse($booking->expected_arrival)
                        ->diffInMinutes(Carbon::parse($booking->expected_departure))
            : $totalMinutes;

        $hoursCharged = (int) ceil($totalMinutes / 60);
        $baseFee = round($hoursCharged * (float) $rule->hourly_rate, 2);

        //Late fee: excess beyond booked duration + grace period
        $allowedMinutes = $bookedMinutes + $rule->grace_period_minutes;
        $excessMinutes  = max(0, $totalMinutes - $allowedMinutes);
        $lateFeeHours   = (int) ceil($excessMinutes / 60);
        $lateFee        = $excessMinutes > 0
            ? round($lateFeeHours * (float) $rule->late_fee_per_hour, 2)
            : 0.00;

        //Totals
        $totalFee    = round($baseFee + $lateFee, 2);
        $advancePaid = (float) ($session->advance_paid ?? ($booking ? $booking->advance_fee_paid : 0));
        $balanceDue  = max(0, round($totalFee - $advancePaid, 2));

        return [
             'total_duration_minutes'  => $totalMinutes,
            'hours_charged'           => $hoursCharged,
            'booked_duration_minutes' => $bookedMinutes,
            'excess_minutes'          => $excessMinutes,
            'grace_period_minutes'    => $rule->grace_period_minutes,
            'hourly_rate'             => (float) $rule->hourly_rate,
            'late_fee_per_hour'       => (float) $rule->late_fee_per_hour,
            'base_fee'                => $baseFee,
            'late_fee'                => $lateFee,
            'total_fee'               => $totalFee,
            'advance_paid'            => $advancePaid,
            'balance_due'             => $balanceDue,
            'is_overtime'             => $excessMinutes > 0,
        ];
    }
}
