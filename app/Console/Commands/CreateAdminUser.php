<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-admin
                            {--email= : Admin user email address}
                            {--password= : Admin user password}
                            {--name= : Admin user name}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin user or upgrade an existing user to admin';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->option('email') ?? $this->ask('Email address');
        $name = $this->option('name') ?? $this->ask('Name');
        $password = $this->option('password') ?? $this->secret('Password');

        // Validate email
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address.');

            return self::FAILURE;
        }

        // Validate password
        $validator = Validator::make(['password' => $password], [
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            $this->error('Password must be at least 8 characters long.');

            return self::FAILURE;
        }

        // Check if user exists
        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            if ($existingUser->role === UserRole::Admin) {
                $this->info("User {$email} is already an admin.");

                return self::SUCCESS;
            }

            if (! $this->confirm("User {$email} already exists. Upgrade to admin?", true)) {
                $this->info('Operation cancelled.');

                return self::SUCCESS;
            }

            $existingUser->update([
                'name' => $name,
                'password' => Hash::make($password),
                'role' => UserRole::Admin,
                'email_verified_at' => $existingUser->email_verified_at ?? now(),
            ]);

            $this->info("User updated to admin: {$email}");

            return self::SUCCESS;
        }

        // Create new admin user
        User::create([
            'email' => $email,
            'name' => $name,
            'password' => Hash::make($password),
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);

        $this->info("Admin user created: {$email}");

        return self::SUCCESS;
    }
}
