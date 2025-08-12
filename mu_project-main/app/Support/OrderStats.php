<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Single source of truth for monetary totals derived from
 * orders + order_items + menu_items. Use this everywhere
 * (Dashboard, Payments page, etc.) to avoid inconsistent numbers.
 */
class OrderStats
{
    /**
     * @return array{
     *   cash_total: float,
     *   qr_total: float,
     *   paid_total: float,
     *   unpaid_total: float
     * }
     */
    public static function totals(): array
    {
        $row = DB::table('orders')
            ->join('order_items', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'menu_items.id', '=', 'order_items.menu_item_id')
            ->selectRaw("
                COALESCE(SUM(CASE WHEN orders.payment_method = 'cash' THEN order_items.quantity * menu_items.price ELSE 0 END), 0) AS cash_total,
                COALESCE(SUM(CASE WHEN orders.payment_method = 'qr'   THEN order_items.quantity * menu_items.price ELSE 0 END), 0) AS qr_total,
                COALESCE(SUM(CASE WHEN orders.is_paid = 1 THEN order_items.quantity * menu_items.price ELSE 0 END), 0)        AS paid_total,
                COALESCE(SUM(CASE WHEN orders.is_paid = 0 THEN order_items.quantity * menu_items.price ELSE 0 END), 0)        AS unpaid_total
            ")
            ->first();

        return [
            'cash_total'   => (float) ($row->cash_total   ?? 0),
            'qr_total'     => (float) ($row->qr_total     ?? 0),
            'paid_total'   => (float) ($row->paid_total   ?? 0),
            'unpaid_total' => (float) ($row->unpaid_total ?? 0),
        ];
    }
}
