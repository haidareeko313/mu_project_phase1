<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'auth' => [
    'user' => fn () => auth()->user() ? [
        'id' => auth()->id(),
        'name' => auth()->user()->name,
        'email' => auth()->user()->email,
        'role' => auth()->user()->role, 
    ] : null,
],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'last_order_id' => fn () => $request->session()->get('last_order_id'),
                'pickup_code'   => fn () => $request->session()->get('pickup_code'),
                'show_qr'       => fn () => $request->session()->get('show_qr'),
            ],
        ]);
    }
}
