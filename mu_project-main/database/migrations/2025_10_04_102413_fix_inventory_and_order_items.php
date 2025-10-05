<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // --- order_items: ensure unit_price exists ---
        if (!Schema::hasColumn('order_items', 'unit_price')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->decimal('unit_price', 10, 2)->after('menu_item_id');
            });
        }

        // --- inventory_logs: rename change -> quantity_changed, add action ---
        if (Schema::hasTable('inventory_logs')) {
            if (Schema::hasColumn('inventory_logs', 'change') && !Schema::hasColumn('inventory_logs', 'quantity_changed')) {
                Schema::table('inventory_logs', function (Blueprint $table) {
                    $table->renameColumn('change', 'quantity_changed');
                });
            }

            if (!Schema::hasColumn('inventory_logs', 'action')) {
                Schema::table('inventory_logs', function (Blueprint $table) {
                    $table->enum('action', ['increment', 'decrement'])->default('decrement')->after('quantity_changed');
                });
            }
        }
    }

    public function down(): void
    {
        // Keep it simple / non-destructive on down()
    }
};
