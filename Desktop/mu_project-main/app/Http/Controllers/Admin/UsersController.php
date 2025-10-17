<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($s = $request->string('q')->toString()) {
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%");
            });
        }

        return Inertia::render('Admin/Users/Index', [
            'users' => $query->orderBy('name')->get(['id','name','email','role']),
            'filters' => ['q' => $s ?? ''],
        ]);
    }

    public function toggle(Request $request, User $user)
    {
        $role = $request->string('role')->toString();
        if (! in_array($role, ['admin','student'], true)) {
            $role = $user->role === 'admin' ? 'student' : 'admin';
        }
        $user->update(['role' => $role]);

        return back()->with('success', 'Role updated.');
    }
}
