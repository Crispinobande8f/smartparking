<?php

namespace App\Filament\Resources\Bookings\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class BookingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('user_id')
                    ->required()
                    ->numeric(),
                TextInput::make('slot_id')
                    ->required()
                    ->numeric(),
                TextInput::make('booking_reference')
                    ->required(),
                DateTimePicker::make('booking_time')
                    ->required(),
                DateTimePicker::make('expected_arrival')
                    ->required(),
                DateTimePicker::make('expected_departure')
                    ->required(),
                TextInput::make('advance_fee_paid')
                    ->required()
                    ->numeric()
                    ->default(0),
                TextInput::make('booking_status')
                    ->required()
                    ->default('pending'),
            ]);
    }
}
