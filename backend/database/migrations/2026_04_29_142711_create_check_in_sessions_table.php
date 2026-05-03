<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_in_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_id')->unique();
            $table->foreignId('booking_id')
                  ->constrained('bookings')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignId('slot_id')
                  ->constrained('parking_slots')
                  ->cascadeOnDelete();

            $table->foreignId('checked_in_by')
                  ->nullable()
                  ->after('session_status')
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('checkin_time');
            $table->timestamp('checkout_time')->nullable();
            $table->unsignedInteger('total_duration')->nullable();
            $table->decimal('base_fee', 10, 2)->nullable();
            $table->decimal('late_fee', 10, 2)->nullable()->default(0);
            $table->decimal('total_fee', 10, 2)->nullable();
            $table->decimal('advance_paid', 10, 2)->default(0);
            $table->decimal('balance_paid', 10, 2)->nullable()->default(0);
            $table->string('session_status')->default('active');
            $table->string('mpesa_checkout_id')->nullable();
            $table->string('mpesa_balance_ref')->nullable();

            $table->timestamps();

            // Indexes for common query patterns
            $table->index('user_id');
            $table->index('booking_id');
            $table->index('session_status');
            $table->index('checkout_time');
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('check_in_sessions');
        Schema::table('check_in_sessions', function (Blueprint $table) {
            $table->dropForeign(['checked_in_by']);
            $table->dropColumn('checked_in_by');
        });
    }
};
