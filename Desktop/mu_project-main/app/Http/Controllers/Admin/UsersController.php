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
        $q    = trim((string) $request->query('q', ''));
        $role = $request->query('role'); // admin|student|any

        $builder = User::select('id','name','email','role');

        if ($q !== '') {
            $builder->where(function ($qb) use ($q) {
                $qb->where('email', 'like', "%{$q}%")
                   ->orWhere('name', 'like', "%{$q}%");
            });
        }
        if ($role && $role !== 'any') {
            $builder->where('role', $role);
        }

        $users = $builder->orderBy('name')->paginate(25)->appends($request->query());

        return Inertia::render('Admin/Roles', [
            'filters'     => ['q' => $q, 'role' => $role],
            'users'       => $users,
            'roleOptions' => ['admin','student'],
        ]);
    }

    public function setUserRole(Request $request, User $user)
    {
        $data = $request->validate(['role' => ['required', 'in:admin,student']]);
        $user->role = $data['role'];
        $user->save();

        return back()->with('success', "{$user->name} is now {$user->role}.");
    }
}
