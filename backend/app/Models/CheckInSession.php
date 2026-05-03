<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CheckInSession extends Model
{
    //
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
        

    ]

    protected
}
