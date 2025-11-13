<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run()
    {
        // Create default admin users if they don't exist
        $users = [
            [
                'name' => 'Administrator',
                'email' => 'admin@example.com',
                'password' => 'admin',
            ],
            [
                'name' => 'Jake Admin',
                'email' => 'jake.admin@gmail.com',
                'password' => 'admin123',
            ],
        ];

        foreach ($users as $u) {
            $existing = User::where('email', $u['email'])->first();
            if ($existing) {
                // if user exists but you want to reset password, uncomment next line
                // $existing->update(['password' => Hash::make($u['password'])]);
                continue;
            }

            User::create([
                'name' => $u['name'],
                'email' => $u['email'],
                'password' => Hash::make($u['password']),
            ]);
        }
    }
}
