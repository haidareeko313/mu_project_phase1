<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_method')->default('cash')->after('status');
            $table->boolean('is_paid')->default(false)->after('payment_method');
        });
    }

    public function down(): void
    {
       
        Schema::table('orders', function (Blueprint $table) {
    if (!Schema::hasColumn('orders', 'payment_method')) {
        $table->string('payment_method')->default('cash')->after('status');
    }
    if (!Schema::hasColumn('orders', 'is_paid')) {
        $table->boolean('is_paid')->default(false)->after('payment_method');
    }
});

    }
    
};
