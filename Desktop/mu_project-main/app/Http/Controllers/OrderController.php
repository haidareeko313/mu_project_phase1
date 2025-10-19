<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with([
                'user:id,name',
                'items.menuItem:id,name',
            ])
            ->latest()
            ->paginate(25);

        return Inertia::render('Orders/Index', [
            'orders' => $orders->through(function ($o) {
                return [
                    'id'       => $o->id,
                    'user'     => $o->user?->name,
                    // 👇 force display “completed” whenever the order is paid
                    'status'   => $o->is_paid ? 'completed' : $o->status,
                    'is_paid'  => (bool) $o->is_paid,
                    'method'   => strtoupper($o->payment_method),
                    'created'  => $o->created_at->format('m/d/Y, h:i:s A'),
                    'items'    => $o->items->map(fn ($it) => [
                        'name' => $it->menuItem?->name ?? '',
                        'qty'  => $it->quantity,
                    ])->values(),
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'method'        => ['required', 'in:qr,cash,QR,CASH'],
            'items'         => ['required', 'array', 'min:1'],
            'items.*.id'    => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.qty'   => ['required', 'integer', 'min:1'],
        ]);

        $method = strtolower($data['method']) === 'cash' ? 'CASH' : 'QR';

        $ids   = collect($data['items'])->pluck('id')->all();
        $map   = collect($data['items'])->keyBy('id'); // qty lookup
        $items = MenuItem::whereIn('id', $ids)->get();

        // Optional: basic stock check
        foreach ($items as $mi) {
            $need = (int) $map[$mi->id]['qty'];
            if ($mi->stock_qty !== null && $mi->stock_qty < $need) {
                return back()->with('error', "Not enough stock for {$mi->name}.");
            }
        }

        $pickup = null;

        DB::transaction(function () use ($items, $map, $method, &$pickup) {
            $order = Order::create([
                'user_id'        => auth()->id(),
                'status'         => 'pending',
                'is_paid'        => 0,
                'payment_method' => $method,
                'pickup_code'    => $method === 'CASH'
                    ? str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT)
                    : null,
            ]);

            foreach ($items as $mi) {
                $qty = (int) $map[$mi->id]['qty'];
                $order->items()->create([
                    'menu_item_id' => $mi->id,
                    'quantity'     => $qty,
                    'unit_price'   => $mi->price,
                ]);

                // Optionally reduce stock
                if ($mi->stock_qty !== null) {
                    $mi->decrement('stock_qty', $qty);
                }
            }

            $pickup = $order->pickup_code;
            session()->flash('last_order_id', $order->id);
            if ($method === 'CASH') {
                session()->flash('pickup_code', $pickup);
            } else {
                session()->flash('show_qr', true);
            }
            session()->flash('success', 'Order created! Please pay at the counter.');
        });

        return back();
    }
}
