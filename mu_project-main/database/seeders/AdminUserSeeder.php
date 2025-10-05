<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'admin@example.com';

        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => 'Admin', 'password' => Hash::make('password'), 'role' => 'admin']
        );

        if ($user->role !== 'admin') {
            $user->update(['role' => 'admin']);
        }
    }
}
