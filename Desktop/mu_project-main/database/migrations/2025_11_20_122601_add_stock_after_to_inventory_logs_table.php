<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_logs', function (Blueprint $table) {
            // snapshot of stock immediately AFTER this log
            $table->integer('stock_after')->nullable()->after('quantity_changed');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_logs', function (Blueprint $table) {
            $table->dropColumn('stock_after');
        });
    }
};
