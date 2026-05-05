<?php

namespace App\Filament\Resources\CheckInSessions\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CheckInSessionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('session_id'),
                TextColumn::make('booking_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('user_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('slot_id')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('checked_in_by')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('checkin_time')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('checkout_time')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('total_duration')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('base_fee')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('late_fee')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('total_fee')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('advance_paid')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('balance_paid')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('session_status')
                    ->searchable(),
                TextColumn::make('mpesa_checkout_id')
                    ->searchable(),
                TextColumn::make('mpesa_balance_ref')
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
