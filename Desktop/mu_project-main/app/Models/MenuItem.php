<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class MenuItem extends Model
{
    use HasFactory;

    // If you already have $fillable/$guarded keep yours.
    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        // $this->image should be a path relative to the "public" disk (e.g. "menu_images/foo.png")
        if (!$this->image) {
            return null;
        }
        return Storage::disk('public')->exists($this->image)
            ? Storage::url($this->image)   // => "/storage/menu_images/....png"
            : null;                        // force UI to show placeholder instead of 404
    }
}
