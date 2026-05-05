<?php

namespace App\Filament\Resources\PricingRules\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PricingRuleForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),

                // Locked to the same valid types your app knows about
                Select::make('slot_type')
                    ->required()
                    ->options([
                        'standard' => 'Standard',
                        'economy'  => 'Economy',
                        'premium'  => 'Premium',
                        'VIP'      => 'VIP',
                        'disabled' => 'Disabled',
                    ])
                    ->unique(
                        table: 'pricing_rules',
                        column: 'slot_type',
                        ignoreRecord: true  
                    ),

                TextInput::make('hourly_rate')
                    ->required()
                    ->numeric()
                    ->prefix('KES')
                    ->minValue(0),

                TextInput::make('late_fee_per_hour')
                    ->required()
                    ->numeric()
                    ->prefix('KES')
                    ->minValue(0),

                TextInput::make('advance_payment_percentage')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->maxValue(1)
                    ->hint('e.g. 0.25 = 25%'),

                TextInput::make('grace_period_minutes')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->suffix('minutes'),

                Toggle::make('is_active')
                    ->required()
                    ->default(true),
            ]);
    }
}
