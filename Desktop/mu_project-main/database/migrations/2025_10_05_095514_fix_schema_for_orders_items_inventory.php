<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // ORDERS
        Schema::table('orders', function (Blueprint $t) {
            // make sure we can set any of the statuses we use
            // if 'status' was ENUM and you can't change it on your MySQL,
            // the raw-alternative is shown after this block.
            $t->string('status', 20)->default('pending')->change();

            // QR / CASH stored in this column
            $t->string('payment_method', 10)->default('QR')->change();

            // we give cash orders a 4-digit pickup code; keep nullable
            if (!Schema::hasColumn('orders', 'pickup_code')) {
                $t->string('pickup_code', 10)->nullable()->after('is_paid');
            }
        });

        // ORDER ITEMS
        Schema::table('order_items', function (Blueprint $t) {
            if (!Schema::hasColumn('order_items', 'unit_price')) {
                $t->decimal('unit_price', 10, 2)->default(0)->after('quantity');
            } else {
                // prevent “doesn’t have default” complaints
                $t->decimal('unit_price', 10, 2)->default(0)->change();
            }
        });

        // INVENTORY LOGS
        Schema::table('inventory_logs', function (Blueprint $t) {
            if (Schema::hasColumn('inventory_logs', 'action')) {
                // default action we record when decreasing stock
                $t->string('action', 20)->default('decrement')->change();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | If your MySQL refuses to change ENUM to string above
        | (common on older MariaDB/MySQL), uncomment this line to widen the enum:
        |--------------------------------------------------------------------------
        */
        // DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','accepted','completed') DEFAULT 'pending'");
    }

    public function down(): void
    {
        // No-op; we’re just fixing live schema.
    }
};
