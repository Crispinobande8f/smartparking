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
        // Drop the old constraint
        DB::statement('ALTER TABLE pricing_rules DROP CONSTRAINT pricing_rules_slot_type_check');
        DB::statement('ALTER TABLE parking_slots DROP CONSTRAINT IF EXISTS parking_slots_slot_type_check');

        // Add updated constraint with all 5 types
        DB::statement("
            ALTER TABLE pricing_rules
            ADD CONSTRAINT pricing_rules_slot_type_check
            CHECK (slot_type IN ('standard', 'disabled', 'VIP', 'premium', 'economy'))
        ");

        DB::statement("
            ALTER TABLE parking_slots
            ADD CONSTRAINT parking_slots_slot_type_check
            CHECK (slot_type IN ('standard', 'disabled', 'VIP', 'premium', 'economy'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE pricing_rules DROP CONSTRAINT pricing_rules_slot_type_check');
        DB::statement('ALTER TABLE parking_slots DROP CONSTRAINT IF EXISTS parking_slots_slot_type_check');

        // Restore original constraint
        DB::statement("
            ALTER TABLE pricing_rules
            ADD CONSTRAINT pricing_rules_slot_type_check
            CHECK (slot_type IN ('standard', 'disabled', 'VIP'))
        ");

        DB::statement("
            ALTER TABLE parking_slots
            ADD CONSTRAINT parking_slots_slot_type_check
            CHECK (slot_type IN ('standard', 'disabled', 'VIP'))
        ");
    }
};
