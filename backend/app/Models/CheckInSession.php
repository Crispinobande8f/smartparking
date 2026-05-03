<?php
// CheckInSession.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CheckInSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'booking_id',
        'user_id',
        'slot_id',
        'checkin_time',
        'checkout_time',
        'total_duration',
        'base_fee',
        'late_fee',
        'total_fee',
        'advance_paid',
        'balance_paid',
        'session_status',
        'mpesa_balance_ref',
        'checked_in_by',
    ];

    protected function casts(): array
    {
        return [
            'checkin_time' => 'datetime',
            'checkout_time' => 'datetime',
            'total_duration'  => 'integer',
            'base_fee'  => 'decimal:2',
            'late_fee'   => 'decimal:2',
            'total_fee'    => 'decimal:2',
            'advance_paid' => 'decimal:2',
            'balance_paid' => 'decimal:2',
        ];
    }

    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function slot()
    {
        return $this->belongsTo(ParkingSlot::class, 'slot_id');
    }

    // Helper: calculate due amount after advance payment
    public function getAmountDueAttribute(): float
    {
        return max(0, $this->total_fee - $this->advance_paid);
    }

    public function checkedInBy()
    {
        return $this->belongsTo(User::class, 'checked_in_by');
    }
}
