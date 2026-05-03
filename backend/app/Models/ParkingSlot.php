<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ParkingSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'slot_number',
        'slot_type',
        'status',
        'hourly_rate',
        'location_description',
        'is_active',
    ];

    protected function casts():array
    {
        return[
            'hourly_rate' => 'decimal:2',
            'is_active'   => 'boolean',
        ];
    }

    public function activeBooking()
    {
        return $this-> hasOne(Booking::class)
            ->whereIn('status',['active','reserved'])
            ->latest();
    }

    public function activeSessions()
    {
        return $this->hasMany(CheckInSession::class, 'slot_id')
                    ->whereNull('checkout_time');
    }

    public function getHourlyRate()
    {
        return (float) $this ->hourly_rate;
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    // AuditLog model
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function slot()
    {
        return $this->belongsTo(ParkingSlot::class, 'parking_slot_id');
    }
}
