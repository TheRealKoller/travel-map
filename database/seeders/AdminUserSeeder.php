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
        $email = config('admin.user.email');
        $password = config('admin.user.password');
        $name = config('admin.user.name');

        if (! $email || ! $password || ! $name) {
            if ($this->command) {
                $this->command->warn('Admin user configuration missing in .env file.');
                $this->command->warn('Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME to create an admin user.');
            }

            return;
        }

        $existingUser = User::where('email', $email)->first();

        $attributes = [
            'name' => $name,
            'role' => UserRole::Admin,
        ];

        // Only hash the password if user doesn't exist or password has changed
        if (! $existingUser || ! Hash::check($password, $existingUser->password)) {
            $attributes['password'] = Hash::make($password);
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            $attributes
        );

        // Set email_verified_at using forceFill to bypass fillable restriction
        $user->forceFill(['email_verified_at' => now()])->save();

        if ($this->command) {
            if ($user->wasRecentlyCreated) {
                $this->command->info("Admin user created: {$email}");
            } else {
                $this->command->info("Admin user updated: {$email}");
            }
        }
    }
}
