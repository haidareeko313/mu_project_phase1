<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function adminOnly(User $user): bool
    {
        return $user->role === 'admin';
    }
}
