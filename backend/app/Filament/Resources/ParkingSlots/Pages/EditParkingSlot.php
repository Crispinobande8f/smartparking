<?php

namespace App\Filament\Resources\ParkingSlots\Pages;

use App\Filament\Resources\ParkingSlots\ParkingSlotResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditParkingSlot extends EditRecord
{
    protected static string $resource = ParkingSlotResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
