<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Booking extends Model
{
    //
    use HasFactory;

    protected $fillable = [
        'user_id',
        'slot_id',
        'booking_reference',
        'booking_time',
        'expected_arrival',
        'expected_departure',
        'advance_fee_paid',
        'booking_status',

    ];

    protected function casts(): array
    {
        return [
            'booking_time' => 'datetime',
            'expected_arrival' => 'datetime',
            'expected_departure' => 'datetime',
            'advance_fee_paid' => 'decimal:2',
            'booking_status'=>'string',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function slot()
    {
        return $this->belongsTo(ParkingSlot::class, 'slot_id');
    }
}
