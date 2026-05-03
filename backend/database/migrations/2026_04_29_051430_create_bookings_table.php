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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('slot_id')->constrained('parking_slots')->cascadeOnDelete();
            $table->string('booking_reference')->unique();
            $table->timestamp('booking_time');
            $table->timestamp('expected_arrival');
            $table->timestamp('expected_departure');
            $table->decimal('advance_fee_paid',8,2)->default(0);
            $table->enum('booking_status',[
                'pending',
                'confirmed',
                'active',
                'completed',
                'cancelled',
            ])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
