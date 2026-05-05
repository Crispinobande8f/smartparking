<?php

namespace App\Filament\Resources\ParkingSlots;

use App\Filament\Resources\ParkingSlots\Pages\CreateParkingSlot;
use App\Filament\Resources\ParkingSlots\Pages\EditParkingSlot;
use App\Filament\Resources\ParkingSlots\Pages\ListParkingSlots;
use App\Filament\Resources\ParkingSlots\Schemas\ParkingSlotForm;
use App\Filament\Resources\ParkingSlots\Tables\ParkingSlotsTable;
use App\Models\ParkingSlot;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class ParkingSlotResource extends Resource
{
    protected static ?string $model = ParkingSlot::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'ParkingSlots';

    public static function form(Schema $schema): Schema
    {
        return ParkingSlotForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ParkingSlotsTable::configure($table);
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
            'index' => ListParkingSlots::route('/'),
            'create' => CreateParkingSlot::route('/create'),
            'edit' => EditParkingSlot::route('/{record}/edit'),
        ];
    }
}
