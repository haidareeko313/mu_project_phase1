<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OrderController extends Controller
{
    // ====== LIST ORDERS (unchanged example) =================================
    public function index()
    {
        $orders = Order::with(['user', 'orderItems.menuItem'])
            ->latest()
            ->get()
            ->map(function ($o) {
                return [
                    'id'             => $o->id,
                    'status'         => $o->status,
                    'payment_method' => $o->payment_method,
                    'is_paid'        => (bool) $o->is_paid,
                    'created_at'     => $o->created_at?->toDateTimeString(),
                    'user'           => $o->user ? [
                        'id'    => $o->user->id,
                        'name'  => $o->user->name,
                        'email' => $o->user->email,
                    ] : null,
                    'items'          => $o->orderItems->map(fn ($it) => [
                        'id'       => $it->id,
                        'quantity' => $it->quantity,
                        'menu_item'=> [
                            'id'    => $it->menuItem?->id,
                            'name'  => $it->menuItem?->name,
                            'price' => $it->menuItem?->price,
                        ],
                    ]),
                ];
            });

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
        ]);
    }

    // ====== CREATE / STORE (your existing code if any) =======================

    // ====== EDIT / UPDATE / DESTROY (your existing code if any) =============

    // ====== PAYMENTS / RECEIPTS PAGE ========================================
    public function receiptsAndPayments()
    {
        // ---- List of orders with computed total_amount per order ------------
        $orders = Order::with('user:id,name,email')
            ->select('id', 'user_id', 'status', 'payment_method', 'is_paid', 'created_at')
            ->addSelect([
                'total_amount' => DB::table('order_items')
                    ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
                    ->whereColumn('order_items.order_id', 'orders.id')
                    ->selectRaw('COALESCE(SUM(order_items.quantity * menu_items.price), 0)')
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($o) {
                $o->total_amount = (float) $o->total_amount;
                return $o;
            });

        // ---- Totals by payment method (MATCHES DASHBOARD SQL) ----------------
        $totalsRow = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->selectRaw("
                SUM(CASE WHEN orders.payment_method = 'cash' THEN order_items.quantity * menu_items.price ELSE 0 END) AS cash_total,
                SUM(CASE WHEN orders.payment_method = 'qr'   THEN order_items.quantity * menu_items.price ELSE 0 END) AS qr_total
            ")
            ->first();

        $cashTotal = (float) ($totalsRow->cash_total ?? 0);
        $qrTotal   = (float) ($totalsRow->qr_total   ?? 0);

        // ---- Current QR image URL (public/storage/qr/current.png) -----------
        $qrUrl = Storage::disk('public')->exists('qr/current.png')
            ? asset('storage/qr/current.png')
            : null;

        return Inertia::render('Orders/PaymentsReceipts', [
            'orders'         => $orders,
            'totals'         => [
                'cash_total' => $cashTotal,
                'qr_total'   => $qrTotal,
            ],
            'qr_public_path' => $qrUrl,
        ]);
    }

    // ====== Actions triggered from the Payments page ========================
    public function updatePaymentMethod(Request $request, Order $order)
    {
        $data = $request->validate(['payment_method' => 'required|in:cash,qr']);
        $order->update(['payment_method' => $data['payment_method']]);

        return back()->with('success', 'Payment method updated.');
    }

    public function markPaid(Request $request, Order $order)
    {
        $data = $request->validate(['is_paid' => 'required|boolean']);
        $order->update(['is_paid' => (bool) $data['is_paid']]);

        return back()->with('success', 'Order payment status updated.');
    }

    public function uploadQr(Request $request)
    {
        $request->validate([
            'qr' => 'required|image|mimes:png,jpg,jpeg,webp|max:4096',
        ]);

        // Save as a fixed name so the UI can always reference the same URL
        $request->file('qr')->storeAs('qr', 'current.png', 'public');

        return back()->with('success', 'QR image updated.');
    }
}
