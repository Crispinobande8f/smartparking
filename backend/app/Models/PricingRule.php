<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PricingRule extends Model
{
    //
    use HasFactory;

    protected $fillable =[
        'name',
        'slot_type',
        'hourly_rate',
        'late_fee_per_hour',
        'advance_payment_percentage',
        'grace_period_minutes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
            'late_fee_per_hour' => 'decimal:2',
            'advance_payment_percentage' => 'decimal:2',
            'grace_period_minutes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public static function getForSlotType(string $slotType): self
    {
        return static::where('slot_type', $slotType)
            ->where('is_active', true)
            ->firstOrFail();
    }
}
