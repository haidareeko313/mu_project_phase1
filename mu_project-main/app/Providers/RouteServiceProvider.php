<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * Where to redirect users after login/registration.
     */
    public const HOME = '/cafeteria'; // <— make HOME the cafeteria path

    public function boot(): void
    {
        //
    }
}
