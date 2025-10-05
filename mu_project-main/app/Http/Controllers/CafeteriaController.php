<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CafeteriaController extends Controller
{
    public function index()
    {
        $items = MenuItem::where('is_active', true)
            ->orderBy('name')
            ->get(['id','name','price','image','updated_at']);

        // Cache-busted QR url so the newest image is always shown
        $qrPath = 'payments_qr/current.png';
        $qrUrl  = null;
        if (Storage::disk('public')->exists($qrPath)) {
            $ver   = Storage::disk('public')->lastModified($qrPath);
            $qrUrl = asset('storage/'.$qrPath) . '?v=' . $ver;
        }

        return Inertia::render('Cafeteria/Index', [
            'items' => $items,
            'qrUrl' => $qrUrl,
        ]);
    }
}
