<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class MenuItem extends Model
{
    use HasFactory;

    /**
     * Allow mass-assignment for the fields we create/update.
     * (Add or remove keys to match your table exactly.)
     */
    protected $fillable = [
        'name',
        'price',
        'stock_qty',
        'is_active',
        'image',
       
    ];

    /**
     * Helpful casting so you always get consistent types.
     */
    protected $casts = [
        'price'     => 'decimal:2',
        'stock_qty' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        return Storage::disk('public')->exists($this->image)
            ? Storage::url($this->image)    // => "/storage/..."
            : null;
    }
}
