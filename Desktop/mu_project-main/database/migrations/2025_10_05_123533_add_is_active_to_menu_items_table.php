<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $t) {
            if (!Schema::hasColumn('menu_items', 'is_active')) {
                $t->boolean('is_active')->default(true)->after('image');
            }
            if (!Schema::hasColumn('menu_items', 'stock_qty')) {
                $t->integer('stock_qty')->default(0)->after('price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $t) {
            if (Schema::hasColumn('menu_items', 'is_active')) {
                $t->dropColumn('is_active');
            }
            if (Schema::hasColumn('menu_items', 'stock_qty')) {
                $t->dropColumn('stock_qty');
            }
        });
    }
};
