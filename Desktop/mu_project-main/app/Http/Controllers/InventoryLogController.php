<?php

namespace App\Http\Controllers;

use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class InventoryLogController extends Controller
{
    public function index(Request $request)
    {
        
    $q         = trim((string) $request->query('q', ''));
    $from      = $request->query('from');
    $to        = $request->query('to');
    $type      = strtolower((string) $request->query('type', 'any'));       // "any" | "order" | "adjustment"
    $direction = strtolower((string) $request->query('direction', 'any'));  // "any" | "up" | "down"

    $builder = InventoryLog::query()
        ->with(['user:id,email', 'menuItem:id,name,stock_qty'])
        ->orderByDesc('created_at');

    // search (id, user email, item name)
    if ($q !== '') {
        $builder->where(function ($w) use ($q) {
            if (preg_match('/^\s*#?(\d+)\s*$/', $q, $m)) {
                $id = (int) $m[1];
                $w->orWhere('id', $id);
            }

            $w->orWhereHas('user', function ($wu) use ($q) {
                $wu->where('email', 'like', '%'.$q.'%');
            });

            $w->orWhereHas('menuItem', function ($wi) use ($q) {
                $wi->where('name', 'like', '%'.$q.'%');
            });
        });
    }

    // date range
    if ($from) {
        $builder->where('created_at', '>=', Carbon::parse($from)->startOfDay());
    }

    if ($to) {
        $builder->where('created_at', '<=', Carbon::parse($to)->endOfDay());
    }

    // filter by type (order / adjustment)
    if (in_array($type, ['order', 'adjustment'], true)) {
        $builder->where('action', $type);
    }

    // filter by direction (increase / decrease)
    if ($direction === 'up') {
        $builder->where('quantity_changed', '>', 0);
    } elseif ($direction === 'down') {
        $builder->where('quantity_changed', '<', 0);
    }

    $logs = $builder->paginate(50)->appends($request->query());

    $logs->getCollection()->transform(function (InventoryLog $log) {
        return [
            'id'               => $log->id,
            'user'             => $log->user?->email ?? '—',
            'item'             => $log->menuItem?->name ?? '—',
            'quantity_changed' => (int) $log->quantity_changed,
            'action'           => $log->action,
            'stock_after'      => $log->stock_after,   // 👈 use snapshot column
            'created'          => optional($log->created_at)->format('Y-m-d H:i:s') ?? '—',
        ];
    });


    return Inertia::render('Inventory/Index', [
        'logs'    => $logs,
        'filters' => [
            'q'         => $q,
            'from'      => $from,
            'to'        => $to,
            'type'      => $type,
            'direction' => $direction,
        ],
    ]);
}

}
