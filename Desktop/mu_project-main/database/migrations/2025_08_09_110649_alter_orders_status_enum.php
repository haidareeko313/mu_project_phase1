<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Make sure status accepts 'pending' and 'completed'
        // If your column is VARCHAR, this still works (it just keeps VARCHAR).
        // If it’s ENUM, this replaces the allowed set.
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','completed') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending') NOT NULL DEFAULT 'pending'");
    }
};