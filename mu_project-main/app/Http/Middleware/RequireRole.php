<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireRole
{
    /**
     * Usage:
     *   ->middleware(\App\Http\Middleware\RequireRole::class.':admin')
     *   ->middleware(\App\Http\Middleware\RequireRole::class.':student,admin')
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user) abort(401);

        // Normalize roles: "student,admin" => ['student','admin']
        $needed = [];
        foreach ($roles as $r) {
            foreach (preg_split('/[,\|]/', (string)$r) as $p) {
                $p = strtolower(trim($p));
                if ($p !== '') $needed[] = $p;
            }
        }
        $needed = array_values(array_unique($needed));

        // Prefer Spatie if available
        if (method_exists($user, 'getRoleNames')) {
            $assigned = collect($user->getRoleNames())->map(fn($n) => strtolower($n))->all();
            foreach ($needed as $want) {
                if (in_array($want, $assigned, true)) return $next($request);
            }
            if (method_exists($user, 'roles')) {
                $rel = $user->roles->pluck('name')->map(fn($n) => strtolower($n))->all();
                foreach ($needed as $want) if (in_array($want, $rel, true)) return $next($request);
            }
        }

        // Fallback to a plain "role" column if someone uses it
        if (property_exists($user, 'role')) {
            if (in_array(strtolower((string)$user->role), $needed, true)) return $next($request);
        }

        abort(403, "You don't have the required role.");
    }
}
