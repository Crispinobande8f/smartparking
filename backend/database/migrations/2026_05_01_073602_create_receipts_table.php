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
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                ->constrained('check_in_sessions')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('receipt_ref')->unique();
            $table->string('advance_ref')->nullable();  // M-Pesa ref for advance payment
            $table->string('balance_ref')->nullable();  // M-Pesa ref for balance payment
            $table->decimal('total_paid', 10, 2);
            $table->timestamp('generated_at');

            $table->timestamps();

            $table->index('user_id');
            $table->index('receipt_ref');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
