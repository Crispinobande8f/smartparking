<?php

namespace App\Filament\Resources\AuditLogs\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class AuditLogForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('parking_slot_id')
                    ->required()
                    ->numeric(),
                TextInput::make('user_id')
                    ->numeric(),
                TextInput::make('from_status')
                    ->required(),
                TextInput::make('to_status')
                    ->required(),
                TextInput::make('reason'),
                DateTimePicker::make('changed_at')
                    ->required(),
            ]);
    }
}
