<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // exactly two roles
        foreach (['student', 'admin'] as $name) {
            Role::firstOrCreate(['name' => $name]);
        }

        // Optional: make the very first user an admin so you can log in and manage
        if ($u = User::query()->first()) {
            if (method_exists($u, 'assignRole')) {
                $u->assignRole('admin');
            }
        }
    }
}
