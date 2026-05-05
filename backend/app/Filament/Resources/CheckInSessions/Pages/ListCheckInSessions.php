<?php

namespace App\Filament\Resources\CheckInSessions\Pages;

use App\Filament\Resources\CheckInSessions\CheckInSessionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCheckInSessions extends ListRecords
{
    protected static string $resource = CheckInSessionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
