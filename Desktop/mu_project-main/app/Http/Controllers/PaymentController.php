<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index()
    {
        $orders = Order::with(['user', 'items'])
            ->latest()
            ->take(25)
            ->get()
            ->map(function (Order $o) {
                $total = $o->items->sum(fn ($i) => (float)$i->unit_price * (int)$i->quantity);
                return [
                    'id'      => $o->id,
                    'user'    => $o->user?->name ?? '-',
                    'status'  => $o->status,
                    'paid'    => (bool) $o->is_paid,
                    'method'  => strtoupper((string)$o->payment_method),
                    'total'   => round($total, 2),
                    'created' => $o->created_at->toDateTimeString(),
                ];
            });

        $qrPath = 'payments_qr/current.png';
        $qrUrl = null;
        if (Storage::disk('public')->exists($qrPath)) {
            $version = Storage::disk('public')->lastModified($qrPath);
            $qrUrl   = asset('storage/'.$qrPath) . '?v=' . $version; // cache-bust
        }

        return Inertia::render('Payments/Index', [
            'orders' => $orders,
            'qrUrl'  => $qrUrl,
        ]);
    }

    public function markPaid(Order $order)
    {
        $order->update(['is_paid' => true, 'status' => 'completed']);
        return back()->with('success', "Order #{$order->id} marked paid.");
    }

    public function markUnpaid(Order $order)
    {
        $order->update(['is_paid' => false, 'status' => 'pending']);
        return back()->with('success', "Order #{$order->id} marked unpaid.");
    }

    public function setMethod(Order $order, Request $request)
    {
        $method = strtoupper((string)$request->input('method'));
        abort_unless(in_array($method, ['QR', 'CASH'], true), 422, 'Invalid method');
        $order->update(['payment_method' => $method]);
        return back()->with('success', "Order #{$order->id} method set to {$method}.");
    }

    public function uploadQr(Request $request)
    {
        $request->validate(['qr' => ['required', 'image', 'max:4096']]);

        $dir = 'payments_qr';
        Storage::disk('public')->makeDirectory($dir);
        $request->file('qr')->storeAs($dir, 'current.png', 'public');

        // redirect ensures a fresh qrUrl with new cache-busting version
        return to_route('payments.index')->with('success', 'QR updated.');
    }
}
