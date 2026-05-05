<?php

namespace App\Filament\Resources\CheckInSessions;

use App\Filament\Resources\CheckInSessions\Pages\CreateCheckInSession;
use App\Filament\Resources\CheckInSessions\Pages\EditCheckInSession;
use App\Filament\Resources\CheckInSessions\Pages\ListCheckInSessions;
use App\Filament\Resources\CheckInSessions\Schemas\CheckInSessionForm;
use App\Filament\Resources\CheckInSessions\Tables\CheckInSessionsTable;
use App\Models\CheckInSession;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CheckInSessionResource extends Resource
{
    protected static ?string $model = CheckInSession::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'CheckInSessions';

    public static function form(Schema $schema): Schema
    {
        return CheckInSessionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CheckInSessionsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCheckInSessions::route('/'),
            'create' => CreateCheckInSession::route('/create'),
            'edit' => EditCheckInSession::route('/{record}/edit'),
        ];
    }
}
