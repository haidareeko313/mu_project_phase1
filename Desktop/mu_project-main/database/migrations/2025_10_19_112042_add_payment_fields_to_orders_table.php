<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Payment method: 'CASH' or 'QR'
            if (!Schema::hasColumn('orders', 'method')) {
                $table->string('method', 10)->default('CASH')->after('status');
            }

            // Order total
            if (!Schema::hasColumn('orders', 'total')) {
                $table->decimal('total', 10, 2)->default(0)->after('method');
            }

            // Optional 4-digit pickup code for CASH orders
            if (!Schema::hasColumn('orders', 'cash_code')) {
                $table->string('cash_code', 10)->nullable()->after('total');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'cash_code')) {
                $table->dropColumn('cash_code');
            }
            if (Schema::hasColumn('orders', 'total')) {
                $table->dropColumn('total');
            }
            if (Schema::hasColumn('orders', 'method')) {
                $table->dropColumn('method');
            }
        });
    }
};
