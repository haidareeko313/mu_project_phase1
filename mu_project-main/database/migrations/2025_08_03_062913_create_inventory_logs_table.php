<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('inventory_logs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
        $table->string('action'); // e.g., 'order', 'adjustment'
        $table->integer('quantity_changed');
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_logs');
    }
};
