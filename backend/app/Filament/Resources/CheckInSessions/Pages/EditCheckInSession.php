<?php

namespace App\Filament\Resources\CheckInSessions\Pages;

use App\Filament\Resources\CheckInSessions\CheckInSessionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCheckInSession extends EditRecord
{
    protected static string $resource = CheckInSessionResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
