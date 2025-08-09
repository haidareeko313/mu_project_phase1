<?php

namespace App\Http\Controllers;

use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryLogController extends Controller
{
    public function index(Request $request)
    {
        $search   = (string) $request->query('search', '');
        $reason   = (string) $request->query('reason', '');  // UI “reason” → DB “action”
        $from     = $request->query('from');
        $to       = $request->query('to');
        $perPage  = (int) $request->query('per_page', 25);
        $sort     = $request->query('sort', 'id');
        $dir      = strtolower($request->query('dir', 'asc')) === 'desc' ? 'desc' : 'asc';

        // map UI sort keys → DB columns
        $sortable = [
            'id'     => 'inventory_logs.id',
            'change' => 'inventory_logs.quantity_changed',
            'reason' => 'inventory_logs.action',
            'date'   => 'inventory_logs.created_at',
            // 'item' handled separately via join
        ];

        $query = InventoryLog::query()->with('menuItem:id,name');

        if ($search !== '') {
            $query->whereHas('menuItem', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // UI “reason” filter against DB column “action”
        if ($reason !== '') {
            $query->where('action', $reason);
        }

        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }

        // sorting
        if ($sort === 'item') {
            $query->leftJoin('menu_items', 'menu_items.id', '=', 'inventory_logs.menu_item_id')
                  ->select('inventory_logs.*')
                  ->orderBy('menu_items.name', $dir);
        } else {
            $column = $sortable[$sort] ?? 'inventory_logs.id';
            $query->orderBy($column, $dir);
        }

        $logs = $query->paginate($perPage)->appends($request->query())
            ->through(function (InventoryLog $log) {
                return [
                    'id'     => $log->id,
                    'item'   => optional($log->menuItem)->name,
                    'change' => (int) $log->quantity_changed,  // map to UI key
                    'reason' => $log->action,                  // map to UI key
                    'date'   => $log->created_at?->toIso8601String(),
                ];
            });

        // reasons list from DB “action”
        $reasons = InventoryLog::query()
            ->select('action')
            ->whereNotNull('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action')
            ->values();

        return Inertia::render('Inventory/Index', [
            'logs'    => $logs,
            'filters' => [
                'search'   => $search,
                'reason'   => $reason,
                'from'     => $from,
                'to'       => $to,
                'per_page' => $perPage,
                'sort'     => $sort,
                'dir'      => $dir,
            ],
            'reasons' => $reasons,
        ]);
    }

    public function destroy($id)
    {
        $log = InventoryLog::findOrFail($id);
        $log->delete();

        return back();
    }
}
