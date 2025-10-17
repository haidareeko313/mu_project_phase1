<?php

namespace App\Http\Controllers;

use App\Models\InventoryLog;
use Inertia\Inertia;

class InventoryLogController extends Controller
{
    public function index()
    {
        $logs = InventoryLog::with(['menuItem:id,name'])
            ->latest()
            ->select('id','menu_item_id','quantity_changed','action','created_at')
            ->paginate(50);

        return Inertia::render('Inventory/Index', [
            'logs' => $logs,
        ]);
    }
}
