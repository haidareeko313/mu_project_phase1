<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
  { Schema::create('menu_items', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->decimal('price', 8, 2);
    $table->integer('stock')->default(0);
    $table->timestamps();
});

    }
    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
