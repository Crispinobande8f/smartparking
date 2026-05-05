<?php

namespace App\Filament\Resources\ParkingSlots\Schemas;

use App\Models\PricingRule;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ParkingSlotForm
{
    public static function configure(Schema $schema): Schema
    {
        // Pull live rates from DB, keyed by slot_type
        $rules = PricingRule::where('is_active', true)
            ->get()
            ->keyBy('slot_type');

        // Build options dynamically
        $slotTypeOptions = $rules->mapWithKeys(function ($rule) {
            return [
                $rule->slot_type => ucfirst($rule->slot_type)
                    . ' (KES ' . number_format($rule->hourly_rate) . '/hr)',
            ];
        })->toArray();

        // Fallback if DB is empty
        if (empty($slotTypeOptions)) {
            $slotTypeOptions = ['standard' => 'Standard'];
        }

        return $schema
            ->components([
                TextInput::make('slot_number')
                    ->required(),
                Select::make('slot_type')
                    ->required()
                    ->options($slotTypeOptions)
                    ->default('standard'),
                Select::make('status')
                    ->required()
                    ->options([
                        'available'   => 'Available',
                        'reserved'    => 'Reserved',
                        'occupied'    => 'Occupied',
                        'maintenance' => 'Maintenance',
                    ])
                    ->default('available'),
                Textarea::make('location_description')
                    ->columnSpanFull(),
                Toggle::make('is_active')
                    ->required(),
            ]);
    }
}
