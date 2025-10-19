<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Prefer an admin; otherwise the earliest user
        $adminId    = DB::table('users')->where('role', 'admin')->min('id');
        $fallbackId = $adminId ?? DB::table('users')->min('id');

        if (!is_null($fallbackId)) {
            DB::table('inventory_logs')
                ->whereNull('user_id')
                ->update(['user_id' => $fallbackId]);
        }
    }

    public function down(): void
    {
        // Optional: revert backfill
        DB::table('inventory_logs')->update(['user_id' => null]);
    }
};
