<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\MenuItem;
use App\Models\Order;

class CafeteriaController extends Controller
{
    public function index()
    {
        // Menu cards
        $menuItems = MenuItem::select('id','name','price','stock','image')
            ->orderBy('name')
            ->get()
            ->map(function ($m) {
                // if you have an accessor getImageUrlAttribute() this becomes $m->image_url
                $m->image_url = $m->image ? asset('storage/'.ltrim($m->image, 'public/')) : null;
                return $m;
            });

        // Counts
        $ordersCount = Order::count();

        // Totals by method (same logic as payments page)
        $cashTotal = (float) DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->where('orders.payment_method', 'cash')
            ->selectRaw('COALESCE(SUM(order_items.quantity * menu_items.price),0) AS total')
            ->value('total');

        $qrTotal = (float) DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->where('orders.payment_method', 'qr')
            ->selectRaw('COALESCE(SUM(order_items.quantity * menu_items.price),0) AS total')
            ->value('total');

        // Paid vs Unpaid
        $paidTotal = (float) DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->where('orders.is_paid', 1)
            ->selectRaw('COALESCE(SUM(order_items.quantity * menu_items.price),0) AS total')
            ->value('total');

        $unpaidTotal = (float) DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->where('orders.is_paid', 0)
            ->selectRaw('COALESCE(SUM(order_items.quantity * menu_items.price),0) AS total')
            ->value('total');

        // Optional: Low stock count to highlight inventory risk
        $lowStockCount = MenuItem::where('stock', '<=', 5)->count();

        return Inertia::render('Cafeteria/Index', [
            'cards' => [
                'orders_count'  => $ordersCount,
                'cash_total'    => $cashTotal,
                'qr_total'      => $qrTotal,
                'paid_total'    => $paidTotal,
                'unpaid_total'  => $unpaidTotal,
                'low_stock'     => $lowStockCount, // can show as a small badge
            ],
            'menuItems' => $menuItems,
        ]);
    }
}
