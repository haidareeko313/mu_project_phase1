<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\MenuItem;
use App\Models\OrderItem;
use App\Models\InventoryLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['user', 'orderItems.menuItem'])->latest()->get();

        $metrics = [
            'count' => $orders->count(),
        ];

        return Inertia::render('Orders/Index', [
            'orders'  => $orders,
            'metrics' => $metrics,
            'flash'   => session()->get('success'),
        ]);
    }

    public function create()
    {
        $menuItems = MenuItem::select('id','name','price','stock')->orderBy('name')->get();

        return Inertia::render('Orders/Create', [
            'menuItems' => $menuItems,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer|exists:menu_items,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'payment_method'       => 'required|in:cash,qr',
        ]);

        $order = Order::create([
            'user_id'        => auth()->id(),
            'status'         => 'pending',
            'payment_method' => $request->payment_method,
            'is_paid'        => $request->payment_method === 'cash',
        ]);

        foreach ($validated['items'] as $itemData) {
            $menuItem  = MenuItem::findOrFail($itemData['menu_item_id']);
            $quantity  = (int) $itemData['quantity'];

            OrderItem::create([
                'order_id'     => $order->id,
                'menu_item_id' => $menuItem->id,
                'quantity'     => $quantity,
            ]);

            $menuItem->decrement('stock', $quantity);

            InventoryLog::create([
                'menu_item_id'     => $menuItem->id,
                'action'           => 'order',
                'quantity_changed' => -$quantity,
            ]);
        }

        return Inertia::render('Orders/Receipt', [
            'order' => $order->load('orderItems.menuItem', 'user'),
        ]);
    }

    public function edit(Order $order)
    {
        $order->load('orderItems.menuItem', 'user');
        $menuItems = MenuItem::select('id','name','price','stock')->orderBy('name')->get();

        return Inertia::render('Orders/Edit', [
            'order'     => $order,
            'menuItems' => $menuItems,
        ]);
    }

    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status'         => 'required|in:pending,preparing,ready,picked_up,cancelled',
            'payment_method' => 'nullable|in:cash,qr',
            'is_paid'        => 'nullable|boolean',
        ]);

        $order->update([
            'status'         => $validated['status'],
            'payment_method' => $validated['payment_method'] ?? $order->payment_method,
            'is_paid'        => array_key_exists('is_paid', $validated) ? (bool)$validated['is_paid'] : $order->is_paid,
        ]);

        return redirect()->route('orders.index')->with('success', 'Order updated.');
    }

    public function destroy(Order $order)
    {
        $order->orderItems()->delete();
        $order->delete();

        return redirect()->route('orders.index')->with('success', 'Order deleted.');
    }

    /**
     * Payments & Receipts dashboard
     */
    public function receiptsAndPayments()
    {
        $orders = Order::with(['user', 'orderItems.menuItem'])->latest()->get();

        // Map to a simple array with a computed total
        $data = $orders->map(function (Order $o) {
            $total = $o->orderItems->sum(function ($i) {
                $price = optional($i->menuItem)->price ?? 0;
                return $i->quantity * $price;
            });

            return [
                'id'        => $o->id,
                'customer'  => optional($o->user)->name,
                'status'    => $o->status,
                'method'    => $o->payment_method,
                'is_paid'   => (bool) $o->is_paid,
                'total'     => round($total, 2),
                'created_at'=> $o->created_at?->toDateTimeString(),
            ];
        });

        $summary = [
            'count'   => $data->count(),
            'cash'    => $data->where('method', 'cash')->sum('total'),
            'qr'      => $data->where('method', 'qr')->sum('total'),
            'paid'    => $data->where('is_paid', true)->sum('total'),
            'unpaid'  => $data->where('is_paid', false)->sum('total'),
        ];

        $qrSetting = Setting::where('key', 'qr_code_path')->first();
        $qrUrl = $qrSetting && $qrSetting->value
            ? Storage::disk('public')->url($qrSetting->value)
            : null;

        return Inertia::render('Orders/PaymentsReceipts', [
            'orders'  => $data,
            'summary' => $summary,
            'qrUrl'   => $qrUrl,
        ]);
    }

    /**
     * Update payment method for an order (cash or qr)
     */
    public function updatePaymentMethod(Request $request, Order $order)
    {
        $request->validate([
            'method' => 'required|in:cash,qr',
        ]);

        $order->update(['payment_method' => $request->method]);

        return back();
    }

    /**
     * Mark order as paid / unpaid
     */
    public function markPaid(Request $request, Order $order)
    {
        $request->validate([
            'is_paid' => 'required|boolean',
        ]);

        $order->update(['is_paid' => (bool)$request->is_paid]);

        return back();
    }

    /**
     * Upload QR code image (stored in settings)
     */
    public function uploadQr(Request $request)
    {
        $request->validate([
            'qr' => 'required|image|mimes:png,jpg,jpeg,webp|max:4096',
        ]);

        $path = $request->file('qr')->store('qr_codes', 'public');

        Setting::updateOrCreate(
            ['key' => 'qr_code_path'],
            ['value' => $path]
        );

        return back();
    }
}
