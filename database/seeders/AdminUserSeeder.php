<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL');
        $password = env('ADMIN_PASSWORD');
        $name = env('ADMIN_NAME');

        if (! $email || ! $password || ! $name) {
            $this->command->warn('Admin user configuration missing in .env file.');
            $this->command->warn('Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME to create an admin user.');

            return;
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => UserRole::Admin,
                'email_verified_at' => now(),
            ]
        );

        if ($user->wasRecentlyCreated) {
            $this->command->info("Admin user created: {$email}");
        } else {
            $this->command->info("Admin user updated: {$email}");
        }
    }
}
