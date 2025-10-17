<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
       Schema::create('feedback', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
    $table->tinyInteger('rating')->unsigned(); // 1–5
    $table->text('comment')->nullable();
    $table->timestamps();
});

    }

    
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
