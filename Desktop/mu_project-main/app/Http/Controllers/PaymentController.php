<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;

class PaymentController extends Controller
{
    /**
     * Payments dashboard
     */
    public function index()
    {
        // Current QR on public disk
        $qrPath = 'payments_qr/current.png';
        $qrUrl = null;
        if (Storage::disk('public')->exists($qrPath)) {
            $qrUrl = asset('storage/' . $qrPath) . '?t=' . time(); // cache buster
        }

        // Recent orders
        $orders = Order::with(['user:id,name', 'items'])
            ->latest()
            ->paginate(25);

        return Inertia::render('Payments/Index', [
            'currentQr' => $qrUrl,
            'orders' => $orders->through(function ($o) {
                // ----- figure out a cash code to show (support both new + legacy) -----
                $cashCode = null;
                $isCash   = strtoupper($o->payment_method) === 'CASH';
                $isPaid   = (bool) $o->is_paid;
                $isPendingByNewField = ($o->payment_status ?? 'pending') === 'pending';

                if ($isCash && ! $isPaid && $isPendingByNewField) {
                    // prefer new encrypted field
                    if (!empty($o->pickup_code_encrypted)) {
                        try {
                            $cashCode = Crypt::decryptString($o->pickup_code_encrypted);
                        } catch (\Throwable $e) {
                            $cashCode = null;
                        }
                    }
                    // fallback: legacy plaintext column if exists
                    if (!$cashCode && !empty($o->pickup_code)) {
                        $cashCode = $o->pickup_code;
                    }
                }

                // compute total from items (if not stored on Order)
                $total = optional($o->items)->sum(function ($it) {
                    return ((float) ($it->unit_price ?? 0)) * ((int) ($it->quantity ?? 0));
                });

                return [
                    'id'        => $o->id,
                    'user'      => $o->user?->name,
                    'status'    => $o->status,
                    'is_paid'   => $isPaid,
                    'method'    => strtoupper($o->payment_method),
                    'payment_status' => $o->payment_status ?? ($isPaid ? 'paid' : 'pending'),
                    'cash_code' => $cashCode,
                    'total'     => number_format((float) $total, 2),
                    'created'   => $o->created_at?->format('Y-m-d H:i:s'),
                ];
            }),
        ]);
    }

    /**
     * Mark order paid
     */
    public function markPaid(Order $order)
    {
        $order->is_paid = 1;
        $order->payment_status = 'paid';
        $order->paid_at = Carbon::now();
        $order->paid_by = auth()->id();

        // clear any codes so they can't be reused
        if (schema()->hasColumn('orders', 'pickup_code_hash')) {
            $order->pickup_code_hash = null;
        }
        if (schema()->hasColumn('orders', 'pickup_code_encrypted')) {
            $order->pickup_code_encrypted = null;
        }
        if (schema()->hasColumn('orders', 'pickup_code_expires_at')) {
            $order->pickup_code_expires_at = null;
        }
        // legacy plaintext column (if you still have it)
        if (schema()->hasColumn('orders', 'pickup_code')) {
            $order->pickup_code = null;
        }

        $order->save();

        return back()->with('success', "Order #{$order->id} marked paid.");
    }

    /**
     * Mark order unpaid
     */
    public function markUnpaid(Order $order)
    {
        $order->is_paid = 0;
        $order->payment_status = 'pending';
        $order->paid_at = null;
        $order->paid_by = null;
        $order->save();

        return back()->with('success', "Order #{$order->id} marked unpaid.");
    }

    /**
     * Set payment method to QR or CASH
     */
    public function setMethod(Request $request, Order $order)
    {
        $data = $request->validate([
            'method' => ['required', 'in:QR,CASH,qr,cash'],
        ]);

        $order->payment_method = strtoupper($data['method']);
        $order->save();

        return back()->with('success', "Order #{$order->id} set to {$order->payment_method}.");
    }

    /**
     * Upload QR image to public storage
     */
    public function uploadQr(Request $request)
    {
        $request->validate([
            'qr' => ['required', 'image', 'mimes:png,jpg,jpeg', 'max:4096'],
        ]);

        $request->file('qr')->storeAs('payments_qr', 'current.png', 'public');

        return back()->with('success', 'QR uploaded.');
    }
}

/**
 * Tiny helper to check columns safely (avoids errors if some migrations not applied yet).
 */
if (! function_exists('schema')) {
    function schema()
    {
        return app('db.schema');
    }
}
