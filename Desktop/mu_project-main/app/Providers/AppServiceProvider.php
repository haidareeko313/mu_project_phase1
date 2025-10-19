<?php

namespace App\Providers;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use App\Models\InventoryLog;
use App\Observers\InventoryLogObserver;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Fix "Specified key was too long; max key length is 1000 bytes"
        Schema::defaultStringLength(125);

        // ✅ Register the observer so user_id is auto-filled on create
        InventoryLog::observe(InventoryLogObserver::class);

        // Optional: share common props with Inertia
        Inertia::share([
            'auth' => function () {
                $u = auth()->user();
                return $u ? [
                    'user' => [
                        'id'    => $u->id,
                        'name'  => $u->name,
                        'email' => $u->email,
                        'roles' => method_exists($u, 'getRoleNames') ? $u->getRoleNames() : [],
                    ],
                ] : null;
            },
            'flash' => function () {
                return [
                    'success' => session('success'),
                    'error'   => session('error'),
                ];
            },
        ]);
    }
}
