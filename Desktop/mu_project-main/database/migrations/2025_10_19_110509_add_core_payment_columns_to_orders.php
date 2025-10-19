<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'paid')) {
                $table->boolean('paid')->default(false)->after('status');
            }
            if (!Schema::hasColumn('orders', 'payment_method')) {
                $table->string('payment_method', 10)->nullable()->after('paid'); // CASH|QR
            }
            if (!Schema::hasColumn('orders', 'cash_code')) {
                $table->string('cash_code', 8)->nullable()->after('payment_method'); // 4 digits but keep room
            }
            if (!Schema::hasColumn('orders', 'total')) {
                $table->decimal('total', 10, 2)->default(0)->after('cash_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // only drop if they exist
            if (Schema::hasColumn('orders', 'total')) $table->dropColumn('total');
            if (Schema::hasColumn('orders', 'cash_code')) $table->dropColumn('cash_code');
            if (Schema::hasColumn('orders', 'payment_method')) $table->dropColumn('payment_method');
            if (Schema::hasColumn('orders', 'paid')) $table->dropColumn('paid');
        });
    }
};
