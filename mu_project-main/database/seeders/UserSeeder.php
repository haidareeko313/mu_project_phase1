<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Spatie\Permission\Traits\HasRoles;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('pass123'),
                'email_verified_at' => now(),
            ]
        );
        if (method_exists($admin, 'syncRoles')) {
            $admin->syncRoles(['admin']);
        }

        // Student
        $student = User::firstOrCreate(
            ['email' => 'student@example.com'],
            [
                'name' => 'Student',
                'password' => Hash::make('pass123'),
                'email_verified_at' => now(),
            ]
        );
        if (method_exists($student, 'syncRoles')) {
            $student->syncRoles(['student']);
        }
    }
}
