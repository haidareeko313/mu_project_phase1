<?php

namespace App\Http\Controllers;

use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CafeteriaController extends Controller
{
    /**
     * Admin dashboard.
     *
     * Route: GET /cafeteria  (name: cafeteria)
     */
    public function index()
    {
        // ---- Orders count ----------------------------------------------------
        $ordersCount = Order::count();

        // ---- Totals by payment method (exact same logic used on Payments page)
        // We sum quantity * menu_items.price for each order, grouped by orders.payment_method
        $totals = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->selectRaw("
                SUM(CASE WHEN orders.payment_method = 'cash' THEN order_items.quantity * menu_items.price ELSE 0 END) AS cash_total,
                SUM(CASE WHEN orders.payment_method = 'qr'   THEN order_items.quantity * menu_items.price ELSE 0 END) AS qr_total
            ")
            ->first();

        $cashTotal = (float) ($totals->cash_total ?? 0);
        $qrTotal   = (float) ($totals->qr_total   ?? 0);

        // ---- Paid / Unpaid (again based on order_items * price) -------------
        $paidUnpaid = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->selectRaw("
                SUM(CASE WHEN orders.is_paid = 1 THEN order_items.quantity * menu_items.price ELSE 0 END) AS paid_total,
                SUM(order_items.quantity * menu_items.price) AS grand_total
            ")
            ->first();

        $paidTotal   = (float) ($paidUnpaid->paid_total   ?? 0);
        $grandTotal  = (float) ($paidUnpaid->grand_total  ?? 0);

        // ---- Low stock counter (example: stock <= 5) -------------------------
        $lowStockCount = MenuItem::where('stock', '<=', 5)->count();

        // ---- Menu items to show on dashboard --------------------------------
        $menuItems = MenuItem::select('id', 'name', 'price', 'stock', 'image')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($mi) {
                // If your model already has getImageUrlAttribute(), this will be present.
                $mi->image_url = $mi->image_url ?? ($mi->image ? asset('storage/'.$mi->image) : null);
                return $mi;
            });

        return Inertia::render('Cafeteria/Index', [
            'stats' => [
                'orders_count'    => $ordersCount,
                'cash_total'      => $cashTotal,
                'qr_total'        => $qrTotal,
                'paid_total'      => $paidTotal,
                'grand_total'     => $grandTotal,
                'low_stock_count' => $lowStockCount,
            ],
            'menuItems' => $menuItems,
        ]);
    }
}
