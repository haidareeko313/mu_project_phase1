<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Orders list (Admin)
     */
    public function index(Request $request)
    {
        $q       = trim((string) $request->query('q', ''));
        $status  = strtolower((string) $request->query('status', 'any'));
        $paid    = strtolower((string) $request->query('paid', 'any'));
        $method  = strtoupper((string) $request->query('method', 'any'));
        $fromStr = $request->query('from');
        $toStr   = $request->query('to');

        $builder = Order::query()
            ->select('id', 'user_id', 'status', 'method', 'cash_code', 'created_at')
            ->with(['user:id,name,email'])
            ->orderByDesc('created_at');

        // Filters
        if ($q !== '') {
            $builder->where(function ($w) use ($q) {
                if (preg_match('/^\s*#?(\d+)\s*$/', $q, $m)) {
                    $id = (int) $m[1];
                    $w->orWhere('id', $id);
                }
                $w->orWhereHas('user', function ($wu) use ($q) {
                    $wu->where('email', 'like', '%' . $q . '%');
                });
            });
        }

        if (in_array($status, ['pending', 'completed'], true)) {
            $builder->where('status', $status);
        }

        if ($paid === 'yes') {
            $builder->where('status', 'completed');
        } elseif ($paid === 'no') {
            $builder->where('status', '!=', 'completed');
        }

        if (in_array($method, ['CASH', 'QR'], true)) {
            $builder->where('method', $method);
        }

        if ($fromStr) {
            $from = Carbon::parse($fromStr)->startOfDay();
            $builder->where('created_at', '>=', $from);
        }
        if ($toStr) {
            $to = Carbon::parse($toStr)->endOfDay();
            $builder->where('created_at', '<=', $to);
        }

        $orders = $builder->paginate(25)->appends($request->query());

        // Simplified transformer (UI fields)
        $orders->getCollection()->transform(function (Order $o) {
            return [
                'id'        => $o->id,
                'user'      => $o->user?->email ?? '—',
                'status'    => $o->status ?? 'pending',
                'paid'      => $o->status === 'completed' ? 'Yes' : 'No',
                'method'    => $o->method ?? '—',
                'cash_code' => $o->cash_code ?? '—',
                'created'   => optional($o->created_at)->format('Y-m-d H:i:s') ?? '—',
            ];
        });

        return Inertia::render('Orders/Index', [
            'orders'  => $orders,
            'filters' => [
                'q'      => $q,
                'status' => $status,
                'paid'   => $paid,
                'method' => $method,
                'from'   => $fromStr,
                'to'     => $toStr,
            ],
        ]);
    }

    /**
     * Create a new order from the Cafeteria page.
     * - Validates there is enough stock for each item
     * - Inserts the order (and order_items if present)
     * - Decrements stock_qty for each item
     * - Writes an InventoryLog row per item (negative qty)
     */
    public function store(Request $request)
    {
        $request->validate([
            'method'      => ['required', 'in:CASH,QR'],
            'items'       => ['required', 'array', 'min:1'],
            'items.*.id'  => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ]);

        $user         = $request->user();
        $itemsPayload = collect($request->input('items'));

        if ($itemsPayload->isEmpty()) {
            return back()->with('error', 'Your cart is empty.');
        }

        // Load items from DB with stock_qty
        $ids     = $itemsPayload->pluck('id')->all();
        $dbItems = MenuItem::whereIn('id', $ids)
            ->get(['id', 'price', 'name', 'stock_qty'])
            ->keyBy('id');

        // 1) Check stock availability first
        $insufficient = [];
        foreach ($itemsPayload as $it) {
            $mi = $dbItems[$it['id']] ?? null;
            if (!$mi) {
                continue;
            }

            $requested = (int) $it['qty'];
            $available = (int) ($mi->stock_qty ?? 0);

            if ($requested > $available) {
                $insufficient[] = sprintf(
                    '%s (requested %d, available %d)',
                    $mi->name,
                    $requested,
                    $available
                );
            }
        }

        if (!empty($insufficient)) {
            $msg = 'Not enough stock for: ' . implode(', ', $insufficient) . '.';
            return back()
                ->withInput()
                ->with('error', $msg);
        }

        // 2) Build order lines + total (now we know stock is ok)
        $total = 0.0;
        $lines = [];

        foreach ($itemsPayload as $it) {
            $mi = $dbItems[$it['id']] ?? null;
            if (!$mi) {
                continue;
            }

            $qty   = (int) $it['qty'];
            $price = (float) ($mi->price ?? 0);
            $total += $price * $qty;

            $lines[] = [
                'menu_item_id' => $mi->id,
                'qty'          => $qty,
                'unit_price'   => $price,
            ];
        }

        if (empty($lines)) {
            return back()->with('error', 'Your cart is empty.');
        }

        // Detect order_items columns (for flexible schema)
        $hasOrderItems = Schema::hasTable('order_items');
        $qtyCol        = $hasOrderItems
            ? (Schema::hasColumn('order_items', 'qty')
                ? 'qty'
                : (Schema::hasColumn('order_items', 'quantity') ? 'quantity' : null))
            : null;
        $priceCol      = $hasOrderItems
            ? (Schema::hasColumn('order_items', 'unit_price')
                ? 'unit_price'
                : (Schema::hasColumn('order_items', 'price') ? 'price' : null))
            : null;

        // 3) Transaction: create order, items, adjust stock & logs
        [$newOrder, $pickup] = DB::transaction(function () use (
            $request,
            $user,
            $total,
            $lines,
            $qtyCol,
            $priceCol,
            $hasOrderItems
        ) {
            // create order
            $o          = new Order();
            $o->user_id = $user->id;
            $o->status  = 'pending';
            $o->method  = $request->method;
            $o->total   = $total;
            $pickup     = null;

            if ($request->method === 'CASH') {
                $pickup       = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
                $o->cash_code = $pickup;
            }

            $o->save();

            // order_items (if table/columns exist)
            if ($hasOrderItems && $qtyCol && $priceCol) {
                $rows = [];
                foreach ($lines as $ln) {
                    $rows[] = [
                        'order_id'     => $o->id,
                        'menu_item_id' => $ln['menu_item_id'],
                        $qtyCol        => $ln['qty'],
                        $priceCol      => $ln['unit_price'],
                        'created_at'   => now(),
                        'updated_at'   => now(),
                    ];
                }
                if (!empty($rows)) {
                    DB::table('order_items')->insert($rows);
                }
            }

            foreach ($lines as $ln) {
            // decrement stock (never below zero)
            DB::table('menu_items')
                ->where('id', $ln['menu_item_id'])
                ->update([
                    'stock_qty' => DB::raw('GREATEST(stock_qty - '.(int)$ln['qty'].', 0)')
                ]);

            // read the stock AFTER decrement
            $after = \App\Models\MenuItem::whereKey($ln['menu_item_id'])->value('stock_qty');

            InventoryLog::create([
                'menu_item_id'     => $ln['menu_item_id'],
                'user_id'          => $user->id ?? null,
                'action'           => 'order',
                'quantity_changed' => -1 * (int)$ln['qty'],  // negative: removed from stock
                'stock_after'      => (int) $after,          // snapshot after this order
            ]);
        }


            return [$o, $pickup];
        });

        return back()->with([
            'success'       => $request->method === 'CASH'
                ? 'Order placed! You can pay at the counter.'
                : 'Order placed!',
            'last_order_id' => $newOrder->id,
            'pickup_code'   => $pickup,
        ]);
    }
}
