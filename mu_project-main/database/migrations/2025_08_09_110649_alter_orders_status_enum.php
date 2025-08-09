<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Adjust the list to the final set you want to allow
        DB::statement("
            ALTER TABLE orders
            MODIFY COLUMN status
            ENUM('pending','preparing','ready','picked_up','cancelled')
            NOT NULL DEFAULT 'pending'
        ");
    }

    public function down(): void
    {
        // If you want a reversible down(), put your previous enum here.
        // Example (guessing old set):
        DB::statement("
            ALTER TABLE orders
            MODIFY COLUMN status
            ENUM('pending','ready','cancelled')
            NOT NULL DEFAULT 'pending'
        ");
    }
};
