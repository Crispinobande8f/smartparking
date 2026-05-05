<?php

namespace App\Filament\Resources\ParkingSlots\Pages;

use App\Filament\Resources\ParkingSlots\ParkingSlotResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListParkingSlots extends ListRecords
{
    protected static string $resource = ParkingSlotResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
