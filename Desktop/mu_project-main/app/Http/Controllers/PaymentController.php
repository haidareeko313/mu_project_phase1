<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Carbon\Carbon;

class PaymentController extends Controller
{
    /** Payments dashboard (no Roles here) */
    public function index()
    {
        $qrPath = 'payments_qr/current.png';
        $qrUrl = Storage::disk('public')->exists($qrPath)
            ? asset('storage/'.$qrPath) . '?t=' . time()
            : null;

        $orders = Order::with(['user:id,name', 'items'])
            ->latest()
            ->paginate(25);

        return Inertia::render('Payments/Index', [
            'currentQr' => $qrUrl,
            'orders' => $orders->through(function ($o) {
                $cashCode = null;
                $isCash   = strtoupper($o->payment_method) === 'CASH';
                $isPaid   = (bool) $o->is_paid;
                $pending  = ($o->payment_status ?? 'pending') === 'pending';

                if ($isCash && ! $isPaid && $pending) {
                    if (!empty($o->pickup_code_encrypted)) {
                        try { $cashCode = Crypt::decryptString($o->pickup_code_encrypted); } catch (\Throwable $e) {}
                    }
                    if (!$cashCode && !empty($o->pickup_code)) $cashCode = $o->pickup_code;
                }

                $total = optional($o->items)->sum(fn($it) => (float)($it->unit_price ?? 0) * (int)($it->quantity ?? 0));

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

    /** Mark paid / unpaid / set method / upload QR unchanged… */
    public function markPaid(Order $order)
    {
        $order->is_paid = 1;
        $order->payment_status = 'paid';
        $order->paid_at = Carbon::now();
        $order->paid_by = auth()->id();
        foreach (['pickup_code_hash','pickup_code_encrypted','pickup_code_expires_at','pickup_code'] as $col) {
            if (app('db.schema')->hasColumn('orders', $col)) $order->{$col} = null;
        }
        $order->save();
        return back()->with('success', "Order #{$order->id} marked paid.");
    }

    public function markUnpaid(Order $order)
    {
        $order->is_paid = 0;
        $order->payment_status = 'pending';
        $order->paid_at = null;
        $order->paid_by = null;
        $order->save();
        return back()->with('success', "Order #{$order->id} marked unpaid.");
    }

    public function setMethod(Request $request, Order $order)
    {
        $data = $request->validate(['method' => ['required', 'in:QR,CASH,qr,cash']]);
        $order->payment_method = strtoupper($data['method']);
        $order->save();
        return back()->with('success', "Order #{$order->id} set to {$order->payment_method}.");
    }

    public function uploadQr(Request $request)
    {
        $request->validate(['qr' => ['required','image','mimes:png,jpg,jpeg','max:4096']]);
        $request->file('qr')->storeAs('payments_qr', 'current.png', 'public');
        return back()->with('success', 'QR uploaded.');
    }

    /** ---- ROLES PAGE ---- */

    /** Show Roles page */
    public function listUsers()
    {
        $users = User::select('id','name','email','role')->orderBy('name')->get();
        return Inertia::render('Admin/Roles', ['users' => $users]);
    }

    /** Change a user's role */
    public function setUserRole(Request $request, User $user)
    {
        $data = $request->validate(['role' => ['required','in:admin,student']]);
        $user->role = $data['role'];
        $user->save();
        return back()->with('success', "{$user->name} is now {$user->role}.");
    }
}
