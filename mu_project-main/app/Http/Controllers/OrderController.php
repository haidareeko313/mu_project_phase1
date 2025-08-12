<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    // LIST ORDERS
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
                        'quantity' => $it->quantity, // make sure your column is "quantity"
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

    // CREATE FORM
    public function create()
    {
        $menuItems = MenuItem::select('id','name','price','stock')
            ->orderBy('name')
            ->get();

        return Inertia::render('Orders/Create', [
            'menuItems' => $menuItems,
        ]);
    }

    // STORE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items'                => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|integer|exists:menu_items,id',
            'items.*.quantity'     => 'required|integer|min:1',
            'payment_method'       => 'required|in:cash,qr',
        ]);

        $order = Order::create([
            'user_id'        => auth()->id(),
            'status'         => 'pending',
            'payment_method' => $validated['payment_method'],
            'is_paid'        => $validated['payment_method'] === 'cash',
        ]);

        foreach ($validated['items'] as $row) {
            OrderItem::create([
                'order_id'     => $order->id,
                'menu_item_id' => $row['menu_item_id'],
                'quantity'     => $row['quantity'],
            ]);
        }

        return redirect()->route('orders.index')->with('success', 'Order created.');
    }

    // EDIT
    public function edit(Order $order)
    {
        $order->load('orderItems.menuItem', 'user');

        $menuItems = MenuItem::select('id','name','price','stock')
            ->orderBy('name')->get();

        return Inertia::render('Orders/Edit', [
            'order'     => $order,
            'menuItems' => $menuItems,
        ]);
    }

    // UPDATE (status / payment flags)
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status'         => 'nullable|in:pending,preparing,ready,picked_up,cancelled',
            'payment_method' => 'nullable|in:cash,qr',
            'is_paid'        => 'nullable|boolean',
        ]);

        $payload = [];
        if (array_key_exists('status', $validated))         $payload['status'] = $validated['status'];
        if (array_key_exists('payment_method', $validated)) $payload['payment_method'] = $validated['payment_method'];
        if (array_key_exists('is_paid', $validated))        $payload['is_paid'] = (bool) $validated['is_paid'];

        if (!empty($payload)) {
            $order->update($payload);
        }

        return redirect()->route('orders.index')->with('success', 'Order updated.');
    }

    // DESTROY
    public function destroy(Order $order)
    {
        $order->orderItems()->delete();
        $order->delete();

        return redirect()->route('orders.index')->with('success', 'Order deleted.');
    }

    // PAYMENTS / RECEIPTS PAGE
    public function receiptsAndPayments()
    {
        // Orders + computed total_amount per order
        $orders = Order::with('user:id,name,email')
            ->select('id', 'user_id', 'status', 'payment_method', 'is_paid', 'created_at')
            ->addSelect([
                'total_amount' => DB::table('order_items')
                    ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
                    ->whereColumn('order_items.order_id', 'orders.id')
                    ->selectRaw('COALESCE(SUM(order_items.quantity * menu_items.price), 0)')
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($o) {
                $o->total_amount = (float) $o->total_amount;
                return $o;
            });

        // Totals by method (computed from the collection)
        $cashTotal = (float) $orders->where('payment_method', 'cash')->sum('total_amount');
        $qrTotal   = (float) $orders->where('payment_method', 'qr')->sum('total_amount');

        // Public URL for the current QR image (public/storage/qr/current.png)
        $qrUrl = Storage::disk('public')->exists('qr/current.png')
            ? asset('storage/qr/current.png')
            : null;

        return Inertia::render('Orders/PaymentsReceipts', [
            'orders'         => $orders,
            'totals'         => [
                'cash_total' => $cashTotal,
                'qr_total'   => $qrTotal,
            ],
            'qr_public_path' => $qrUrl, // matches your React page
        ]);
    }

    // Payment helper routes
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

    // QR upload (stores to storage/app/public/qr/current.png)
    public function uploadQr(Request $request)
    {
        $request->validate([
            'qr' => 'required|image|mimes:png,jpg,jpeg,webp|max:4096',
        ]);

        $request->file('qr')->storeAs('qr', 'current.png', 'public');

        return back()->with('success', 'QR image updated.');
    }
}
