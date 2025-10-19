<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Student
        User::updateOrCreate(
            ['email' => 'student@example.com'],
            [
                'name' => 'Student',
                'password' => Hash::make('student123'),
                'role' => 'student',
                'email_verified_at' => now(),
            ]
        );
    }
}
