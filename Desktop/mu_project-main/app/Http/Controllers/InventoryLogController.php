<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryLogController extends Controller
{
    public function index(Request $request)
    {
        $q    = trim((string) $request->query('q', ''));
        $from = $request->query('from');
        $to   = $request->query('to');

        $builder = DB::table('inventory_logs as il')
            ->leftJoin('menu_items as mi', 'mi.id', '=', 'il.menu_item_id')
            ->leftJoin('users as u', 'u.id', '=', 'il.user_id')
            ->select([
                'il.id',
                'il.created_at',
                'il.quantity_changed',
                DB::raw('mi.name as item_name'),
                DB::raw('u.email as actor_email'),
                DB::raw('u.name as actor_name'),
            ]);

        if ($q !== '') {
            $builder->where(function ($qb) use ($q) {
                if (ctype_digit($q)) $qb->orWhere('il.id', (int) $q);
                $qb->orWhere('mi.name', 'like', "%{$q}%")
                   ->orWhere('u.email', 'like', "%{$q}%")
                   ->orWhere('u.name',  'like', "%{$q}%");
            });
        }

        if ($from) $builder->where('il.created_at', '>=', Carbon::parse($from)->startOfDay());
        if ($to)   $builder->where('il.created_at', '<=', Carbon::parse($to)->endOfDay());

        $logs = $builder->orderByDesc('il.created_at')
                        ->paginate(25)
                        ->appends($request->query());

        // Keep it a paginator; only map fields we show
        $logs = $logs->through(function ($r) {
            $qty = (int)($r->quantity_changed ?? 0);

            return [
                'id'      => $r->id,
                'user'    => $r->actor_email ?: ($r->actor_name ?: '—'),
                'item'    => $r->item_name ?: '—',
                'qty'     => abs($qty),
                'created' => $r->created_at ? Carbon::parse($r->created_at)->format('Y-m-d H:i:s') : '—',
            ];
        });

        return Inertia::render('Inventory/Index', [
            'filters' => ['q' => $q, 'from' => $from, 'to' => $to],
            'logs'    => $logs,
        ]);
    }
}
