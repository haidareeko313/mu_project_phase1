<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminOnly
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Adjust to your schema; here role is a string column
        if (! $user || $user->role !== 'admin') {
            abort(403, 'Admins only.');
        }

        return $next($request);
    }
}
