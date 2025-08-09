<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'stock',
        'image',
    ];

    // Always include image_url when the model is serialized to JSON
    protected $appends = ['image_url'];

    /**
     * Accessor: image_url
     * Returns a full URL (e.g. /storage/menu_images/abc.jpg) or a placeholder if missing.
     */
    public function getImageUrlAttribute(): string
    {
        if ($this->image) {
            // Storage::url('menu_images/abc.jpg') => '/storage/menu_images/abc.jpg'
            return Storage::url($this->image);
        }

        // Put a placeholder image at public/images/placeholder.png (or change this path)
        return asset('images/placeholder.png');
    }

    // (Keep your relationships here if you have them)
    // public function orderItems(){ ... }
}
