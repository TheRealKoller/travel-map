<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user from environment configuration (production setup)
        $this->call([
            AdminUserSeeder::class,
        ]);

        // User::factory(10)->create();

        // Create a test user for development/testing purposes
        // This uses a different email than the admin user to avoid conflicts
        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
            ]
        );

        // Set email_verified_at using forceFill to bypass fillable restriction
        $testUser->forceFill(['email_verified_at' => now()])->save();
    }
}
