<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\User;
use App\Models\MenuItem;

class Feedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'menu_item_id',
        'rating',
        'comment',
    ];

    /**
     * Each feedback entry belongs to a user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Each feedback entry is linked to a menu item.
     */
    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
