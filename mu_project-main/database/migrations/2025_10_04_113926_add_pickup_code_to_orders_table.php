<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // 4-digit code as string; nullable for old rows
            if (!Schema::hasColumn('orders', 'pickup_code')) {
                $table->string('pickup_code', 4)->nullable()->after('payment_method');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'pickup_code')) {
                $table->dropColumn('pickup_code');
            }
        });
    }
};
