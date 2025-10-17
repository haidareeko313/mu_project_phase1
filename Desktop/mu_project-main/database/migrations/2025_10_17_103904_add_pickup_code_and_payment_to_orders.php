<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPickupCodeAndPaymentToOrders extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('pickup_code_hash')->nullable()->index();
            $table->timestamp('pickup_code_expires_at')->nullable();
            $table->enum('payment_status', ['pending','paid','cancelled'])->default('pending')->index();
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('paid_by')->nullable(); // admin user id
            $table->foreign('paid_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['paid_by']);
            $table->dropColumn(['pickup_code_hash','pickup_code_expires_at','payment_status','paid_at','paid_by']);
        });
    }
}