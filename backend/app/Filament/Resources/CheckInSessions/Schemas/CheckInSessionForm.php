<?php

namespace App\Filament\Resources\CheckInSessions\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class CheckInSessionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('session_id')
                    ->required(),
                TextInput::make('booking_id')
                    ->required()
                    ->numeric(),
                TextInput::make('user_id')
                    ->required()
                    ->numeric(),
                TextInput::make('slot_id')
                    ->required()
                    ->numeric(),
                TextInput::make('checked_in_by')
                    ->numeric(),
                DateTimePicker::make('checkin_time')
                    ->required(),
                DateTimePicker::make('checkout_time'),
                TextInput::make('total_duration')
                    ->numeric(),
                TextInput::make('base_fee')
                    ->numeric(),
                TextInput::make('late_fee')
                    ->numeric()
                    ->default(0),
                TextInput::make('total_fee')
                    ->numeric(),
                TextInput::make('advance_paid')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('balance_paid')
                    ->numeric()
                    ->default(0),
                TextInput::make('session_status')
                    ->required()
                    ->default('active'),
                TextInput::make('mpesa_checkout_id'),
                TextInput::make('mpesa_balance_ref'),
            ]);
    }
}
