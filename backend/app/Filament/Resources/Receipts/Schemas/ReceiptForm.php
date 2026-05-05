<?php

namespace App\Filament\Resources\Receipts\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ReceiptForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('session_id')
                    ->required()
                    ->numeric(),
                TextInput::make('user_id')
                    ->required()
                    ->numeric(),
                TextInput::make('receipt_ref')
                    ->required(),
                TextInput::make('advance_ref'),
                TextInput::make('balance_ref'),
                TextInput::make('total_paid')
                    ->required()
                    ->numeric(),
                DateTimePicker::make('generated_at')
                    ->required(),
            ]);
    }
}
