<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // settings.qr_image_path
        if (Schema::hasTable('settings') && !Schema::hasColumn('settings', 'qr_image_path')) {
            Schema::table('settings', function (Blueprint $t) {
                $t->string('qr_image_path')->nullable()->after('id');
            });
        }

        // make sure orders/status + payment_method + pickup_code exist with safe defaults
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $t) {
                if (Schema::hasColumn('orders', 'status')) {
                    $t->string('status', 20)->default('pending')->change();
                } else {
                    $t->string('status', 20)->default('pending');
                }

                if (Schema::hasColumn('orders', 'payment_method')) {
                    $t->string('payment_method', 10)->default('QR')->change();
                } else {
                    $t->string('payment_method', 10)->default('QR');
                }

                if (!Schema::hasColumn('orders', 'pickup_code')) {
                    $t->string('pickup_code', 10)->nullable()->after('is_paid');
                }
            });
        }

        // order_items.unit_price
        if (Schema::hasTable('order_items') && !Schema::hasColumn('order_items', 'unit_price')) {
            Schema::table('order_items', function (Blueprint $t) {
                $t->decimal('unit_price', 10, 2)->default(0)->after('quantity');
            });
        }

        // inventory_logs.action default
        if (Schema::hasTable('inventory_logs') && Schema::hasColumn('inventory_logs', 'action')) {
            Schema::table('inventory_logs', function (Blueprint $t) {
                $t->string('action', 20)->default('decrement')->change();
            });
        }
    }

    public function down(): void {}
};
