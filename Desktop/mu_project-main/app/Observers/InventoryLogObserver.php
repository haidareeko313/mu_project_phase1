<?php

namespace App\Observers;

use App\Models\InventoryLog;
use Illuminate\Support\Facades\Auth;

class InventoryLogObserver
{
    public function creating(InventoryLog $log): void
    {
        if (is_null($log->user_id) && Auth::check()) {
            $log->user_id = Auth::id();
        }
    }
}
