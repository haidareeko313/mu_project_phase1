<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RolesController extends Controller
{
    // LIST PAGE (you probably already have something like this)
    public function index(Request $request)
    {
        $q    = trim((string) $request->query('q', ''));
        $role = strtolower((string) $request->query('role', 'any'));

        $query = User::query()->orderBy('id');

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', '%'.$q.'%')
                  ->orWhere('email', 'like', '%'.$q.'%');
            });
        }

        if (in_array($role, ['admin', 'student'], true)) {
            // if you store role in a "role" column
            $query->where('role', $role);
        }

        $users = $query->paginate(20)->withQueryString();

        $users->getCollection()->transform(function (User $u) {
            return [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
                'role'  => $u->role ?? ($u->is_admin ? 'admin' : 'student'),
            ];
        });

        return Inertia::render('Admin/Roles', [
            'users'   => $users,
            'filters' => [
                'q'    => $q,
                'role' => $role,
            ],
        ]);
    }

    // 👉 This handles POST /admin/roles/{user}
    public function update(Request $request, User $user)
    {
        $role = strtolower((string) $request->input('role', ''));

        if (!in_array($role, ['admin', 'student'], true)) {
            return back()->with('error', 'Invalid role.');
        }

        // If you have a "role" column (string)
        if (array_key_exists('role', $user->getAttributes())) {
            $user->role = $role;
        }

        // If you instead use a boolean "is_admin" column
        if (array_key_exists('is_admin', $user->getAttributes())) {
            $user->is_admin = $role === 'admin';
        }

        $user->save();

        return back()->with('success', 'Role updated.');
    }
}
