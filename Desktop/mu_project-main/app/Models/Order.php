<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    // If your project uses guarded=[] already, you can skip this.
    protected $fillable = [
        'user_id',
        'status',     // 'pending' | 'completed'
        'method',     // 'CASH' | 'QR'
        'total',      // decimal
        'cash_code',  // nullable 4-digit string for CASH
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
