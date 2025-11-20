<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryLog extends Model
{
    use HasFactory;

        protected $fillable = [
        'menu_item_id',
        'user_id',
        'action',
        'quantity_changed',
        'stock_after',        
        ];

        protected $casts = [
            'quantity_changed' => 'integer',
            'stock_after'      => 'integer',
        ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
