<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = ['name','description','price','stock','image'];

    // 👇 ensures image_url is included in JSON sent to Inertia
    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): string
    {
        // Fallback
        if (empty($this->image)) {
            return asset('images/placeholder.png');
        }

        // If you ever save full URLs, just return them
        if (preg_match('~^https?://~i', $this->image)) {
            return $this->image;
        }

        // Strip possible "public/" and point to /storage/...
        $clean = preg_replace('~^public/~', '', $this->image);

        return asset('storage/'.ltrim($clean, '/'));
    }
}
