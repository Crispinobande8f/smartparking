<?php

namespace App\Filament\Resources\Bookings\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class BookingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('user_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('slot_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('booking_reference')
                    ->searchable(),
                TextColumn::make('booking_time')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('expected_arrival')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('expected_departure')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('advance_fee_paid')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('booking_status')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
