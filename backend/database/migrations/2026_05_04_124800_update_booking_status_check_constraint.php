<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE bookings DROP CONSTRAINT bookings_booking_status_check");

        DB::statement("
            ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check
            CHECK (booking_status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE bookings DROP CONSTRAINT bookings_booking_status_check");

        DB::statement("
            ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check
            CHECK (booking_status IN ('pending', 'confirmed', 'completed', 'cancelled'))
        ");
    }
};
