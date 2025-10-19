<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CafeteriaController extends Controller
{
    public function index()
    {
        $items = MenuItem::query()
            ->orderBy('name')
            ->get(['id', 'name', 'price', 'image'])
            ->map(function ($mi) {
                return [
                    'id'    => $mi->id,
                    'name'  => $mi->name,
                    'price' => (float) $mi->price,
                    'image' => $mi->image, // stored path (we render as /storage/<path> on the page)
                ];
            });

        // Current QR with cache-buster to defeat browser caching after uploads
        $qrUrl = null;
        $disk = Storage::disk('public');
        if ($disk->exists('payments/qr.png')) {
            $version = $disk->lastModified('payments/qr.png'); // unix timestamp
            $qrUrl   = asset('storage/payments/qr.png') . '?v=' . $version;
        }

        return Inertia::render('Cafeteria/Index', [
            'items' => $items,
            'qrUrl' => $qrUrl,
        ]);
    }
}
