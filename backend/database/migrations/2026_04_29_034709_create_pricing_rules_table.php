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
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('slot_type',['standard','disabled','VIP'])->default('standard');
            $table->decimal('hourly_rate',8,2);
            $table->decimal('late_fee_per_hour',8,2);
            $table->decimal('advance_payment_percentage',8,2);
            $table->integer('grace_period_minutes');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
