<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryLog extends Model
{
    protected $fillable = [
        'menu_item_id',
        'action',            // <- was reason
        'quantity_changed',  // <- was change
        'note',
    ];

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
