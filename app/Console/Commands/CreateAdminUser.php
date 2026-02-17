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

        // Warn if password is provided via command line option (security risk)
        if ($this->option('password')) {
            $this->warn('Warning: Passing passwords via command line options can expose them in shell history and process listings.');
            $this->warn('Consider using the interactive mode instead for better security.');
            $password = $this->option('password');
        } else {
            $password = $this->secret('Password');
        }

        // Validate email and password together
        $validator = Validator::make([
            'email' => $email,
            'password' => $password,
        ], [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

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
            ]);

            // Set email_verified_at using forceFill to match seeder behavior
            $existingUser->forceFill(['email_verified_at' => now()])->save();

            $this->info("User updated to admin: {$email}");

            return self::SUCCESS;
        }

        // Create new admin user
        $user = User::create([
            'email' => $email,
            'name' => $name,
            'password' => Hash::make($password),
            'role' => UserRole::Admin,
        ]);

        // Set email_verified_at using forceFill to bypass fillable restriction
        $user->forceFill(['email_verified_at' => now()])->save();

        $this->info("Admin user created: {$email}");

        return self::SUCCESS;
    }
}
