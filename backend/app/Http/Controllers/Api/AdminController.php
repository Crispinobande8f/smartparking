<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CheckInSession;
use App\Models\ParkingSlot;
use App\Models\PricingRule;
use App\Services\BillingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(private BillingService $billing) {}
    // ------------------------------------------------------------------ //
    //  GET /v1/admin/occupancy
    // ------------------------------------------------------------------ //
    public function occupancyDashboard(): JsonResponse
    {
        $slots = ParkingSlot::with([
            'activeSessions.user',
            'activeSessions.booking',
        ])->get();

        $grid = $slots->map(function (ParkingSlot $slot) {
            $activeSession = $slot->activeSessions->first();

            $occupant    = null;
            $elapsedMins = null;
            $isOvertime  = false;

            if ($activeSession) {
                $checkinTime = Carbon::parse($activeSession->checkin_time);
                $elapsedMins = (int) $checkinTime->diffInMinutes(Carbon::now());
                $isOvertime = $this->resolveOvertime($activeSession);

                $occupant = [
                    'name'         => optional($activeSession->user)->name,
                    'session_id'   => $activeSession->session_id,
                    'checkin_time' => $checkinTime->toIso8601String(),
                ];
            }

            return [
                'slot_id'      => $slot->id,
                'slot_number'  => $slot->slot_number,
                'type'         => $slot->slot_type,
                'status'       => $slot->status,
                'location'     => $slot->location_description,
                'occupant'     => $occupant,
                'elapsed_mins' => $elapsedMins,
                'is_overtime'  => $isOvertime,
            ];
        });

        return response()->json([
            'total_slots'    => $slots->count(),
            'occupied'       => $slots->where('status', 'occupied')->count(),
            'available'      => $slots->where('status', 'available')->count(),
            'reserved'       => $slots->where('status', 'reserved')->count(),
            'overtime_count' => $grid->where('is_overtime', true)->count(),
            'slots'          => $grid->values(),
        ]);
    }

    // ------------------------------------------------------------------ //
    //  GET /v1/admin/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
    // ------------------------------------------------------------------ //
    public function revenueReport(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to'   => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = Carbon::parse($request->from)->startOfDay();
        $to   = Carbon::parse($request->to)->endOfDay();

        $sessions = CheckInSession::with('slot')
            ->where('session_status', 'completed')       // FIX: was ->where('status', ...)
            ->whereBetween('checkout_time', [$from, $to])
            ->get();

        $totalSessions  = $sessions->count();
        $totalRevenue   = $sessions->sum('total_fee');
        $totalBaseFee   = $sessions->sum('base_fee');
        $totalLateFee   = $sessions->sum('late_fee');
        $avgDurationMin = $totalSessions > 0
            ? round($sessions->avg('total_duration'), 1)
            : 0;

        $windowMinutes        = $from->diffInMinutes($to);
        $allSlotCount         = ParkingSlot::count();
        $totalSlotMinutes     = $allSlotCount * $windowMinutes;
        $totalOccupiedMinutes = $sessions->sum('total_duration');
        $utilisationPct       = $totalSlotMinutes > 0
            ? round(($totalOccupiedMinutes / $totalSlotMinutes) * 100, 2)
            : 0;

        $bySlotType = $sessions
            ->groupBy(fn ($s) => optional($s->slot)->slot_type ?? 'unknown')
            ->map(fn ($group) => [
                'sessions'     => $group->count(),
                'revenue'      => round($group->sum('total_fee'), 2),
                'avg_duration' => round($group->avg('total_duration'), 1),
            ]);

        return response()->json([
            'period'               => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'total_sessions'       => $totalSessions,
            'total_revenue'        => round($totalRevenue, 2),
            'total_base_fee'       => round($totalBaseFee, 2),
            'total_late_fee'       => round($totalLateFee, 2),
            'avg_session_duration' => $avgDurationMin,
            'slot_utilisation_pct' => $utilisationPct,
            'breakdown_by_type'    => $bySlotType,
        ]);
    }

    // ------------------------------------------------------------------ //
    //  GET /v1/admin/sessions
    // ------------------------------------------------------------------ //
    public function sessionsMonitor(): JsonResponse
    {
        $sessions = CheckInSession::with(['user', 'slot', 'booking'])
            ->whereNull('checkout_time')
            ->whereIn('session_status', ['active', 'awaiting_payment'])
            ->orderBy('checkin_time')
            ->get();

        $data = $sessions->map(function (CheckInSession $session) {
            $checkinTime = Carbon::parse($session->checkin_time);
            $elapsedMins = (int) $checkinTime->diffInMinutes(Carbon::now());
            $expectedDep = Carbon::parse(optional($session->booking)->expected_departure);
            $isOvertime  = $this->resolveOvertime($session);

            $overtimeMins = 0;
            if ($isOvertime && $session->booking) {
                $bookedMins   = (int) Carbon::parse($session->booking->expected_arrival)
                                            ->diffInMinutes($expectedDep);
                $gracePeriod  = $this->resolveGracePeriod($session);
                $overtimeMins = max(0, $elapsedMins - $bookedMins - $gracePeriod);
            }

            return [
                'session_id'        => $session->session_id,
                'status'            => $session->session_status,
                'user'              => [
                    'id'    => optional($session->user)->id,
                    'name'  => optional($session->user)->name,
                    'email' => optional($session->user)->email,
                    'phone' => optional($session->user)->phone_number,
                ],
                'slot'              => [
                    'number' => optional($session->slot)->slot_number,
                    'type'   => optional($session->slot)->slot_type, // FIX: was ->type
                ],
                'checkin_time'       => $checkinTime->toIso8601String(),
                'expected_departure' => $expectedDep->isValid() ? $expectedDep->toIso8601String() : null,
                'elapsed_minutes'    => $elapsedMins,
                'is_overtime'        => $isOvertime,
                'overtime_minutes'   => $overtimeMins,
            ];
        });

        return response()->json([
            'active_sessions' => $data->count(),
            'overtime_count'  => $data->where('is_overtime', true)->count(),
            'sessions'        => $data->values(),
        ]);
    }

    // ------------------------------------------------------------------ //
    //  Private helpers
    // ------------------------------------------------------------------ //

    private function resolveGracePeriod(CheckInSession $session): int
    {
        try {
            $slotType = optional($session->slot)->slot_type ?? 'standard';
            return PricingRule::getForSlotType($slotType)->grace_period_minutes;
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveOvertime(CheckInSession $session): bool
    {
        if (!$session->booking) return false;
        $expectedDep = Carbon::parse($session->booking->expected_departure);
        if (!$expectedDep->isValid()) return false;

        $gracePeriod = $this->resolveGracePeriod($session);
        return Carbon::now()->gt($expectedDep->copy()->addMinutes($gracePeriod));
    }
}
