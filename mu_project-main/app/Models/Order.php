<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',           //  pending, preparing, ready, picked_up, cancelled
        'payment_method',   // 'cash' | 'qr'
        'is_paid',          // boolean
    ];

    protected $casts = [
        'is_paid' => 'boolean',
    ];

    // The user who placed the order
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Line items on this order
    public function orderItems()
    {
        return $this->hasMany(\App\Models\OrderItem::class);
    }

}
