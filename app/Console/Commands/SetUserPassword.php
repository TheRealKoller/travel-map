<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class SetUserPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:set-password
                            {--email= : User email address}
                            {--id= : User ID}
                            {--password= : New password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset a user password';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->option('email');
        $id = $this->option('id');

        // Validate that exactly one of email or id is provided
        if (! $email && ! $id) {
            $this->error('You must provide either --email or --id option.');

            return self::FAILURE;
        }

        if ($email && $id) {
            $this->error('You cannot provide both --email and --id options. Please use only one.');

            return self::FAILURE;
        }

        // Find the user
        $user = $email
            ? User::where('email', $email)->first()
            : User::find($id);

        if (! $user) {
            $identifier = $email ?? "ID {$id}";
            $this->error("User not found: {$identifier}");

            return self::FAILURE;
        }

        // Warn if password is provided via command line option (security risk)
        if ($this->option('password')) {
            $this->warn('Warning: Passing passwords via command line options can expose them in shell history and process listings.');
            $this->warn('Consider using the interactive mode instead for better security.');
            $password = $this->option('password');
        } else {
            $password = $this->secret('New password');
        }

        // Validate password
        $validator = Validator::make([
            'password' => $password,
        ], [
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        // Update password
        $user->update([
            'password' => Hash::make($password),
        ]);

        $this->info("Password updated successfully for {$user->name} ({$user->email})");

        return self::SUCCESS;
    }
}
