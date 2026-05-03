<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = [
        'session_id',
        'user_id',
        'receipt_ref',
        'advance_ref',
        'balance_ref',
        'total_paid',
        'generated_at',
    ];

    protected function casts():array
    {
        return[
            'total_paid' => 'decimal:2',
            'generated_at' => 'datetime',
        ];
    }

    public function session()
    {
        return $this->belongsTo(CheckInSession::class, 'session_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

}
