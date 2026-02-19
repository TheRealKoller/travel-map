<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestSmtpRaw extends Command
{
    protected $signature = 'mail:test-raw';

    protected $description = 'Test raw SMTP connection with detailed debugging';

    public function handle(): int
    {
        $host = config('mail.mailers.smtp.host');
        $port = config('mail.mailers.smtp.port');
        $username = config('mail.mailers.smtp.username');
        $password = config('mail.mailers.smtp.password');
        $encryption = config('mail.mailers.smtp.encryption');

        $this->info('Raw SMTP Connection Test');
        $this->newLine();

        $this->table(
            ['Setting', 'Value'],
            [
                ['Host', $host],
                ['Port', $port],
                ['Username', $username],
                ['Password', $password ? str_repeat('*', min(strlen($password), 20)) : 'NOT SET'],
                ['Encryption', $encryption ?: 'none'],
            ]
        );

        $this->newLine();

        // Test 1: Check if port is reachable
        $this->info('Test 1: Checking if SMTP port is reachable...');
        $connection = @fsockopen($host, $port, $errno, $errstr, 10);

        if (! $connection) {
            $this->error("❌ Cannot connect to {$host}:{$port}");
            $this->error("Error: {$errstr} ({$errno})");

            return self::FAILURE;
        }

        $this->info("✅ Successfully connected to {$host}:{$port}");
        fclose($connection);
        $this->newLine();

        // Test 2: Try to connect via stream with encryption
        if ($encryption === 'ssl') {
            $this->info('Test 2: Testing SSL/TLS connection...');
            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ]);

            $socket = @stream_socket_client(
                "ssl://{$host}:{$port}",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $context
            );

            if (! $socket) {
                $this->error("❌ SSL connection failed: {$errstr} ({$errno})");

                return self::FAILURE;
            }

            $this->info('✅ SSL connection successful');

            // Read server greeting
            $response = fgets($socket);
            $this->line("Server: {$response}");

            fclose($socket);
        }

        $this->newLine();

        // Test 3: Check if credentials format is correct
        $this->info('Test 3: Validating credentials format...');

        if (empty($username)) {
            $this->error('❌ MAIL_USERNAME is empty');

            return self::FAILURE;
        }

        if (empty($password)) {
            $this->error('❌ MAIL_PASSWORD is empty');

            return self::FAILURE;
        }

        $this->info('✅ Credentials are set');
        $this->newLine();

        // Test 4: Show what Laravel will send
        $this->info('Test 4: Authentication details...');
        $this->line('Laravel will attempt to authenticate with:');
        $this->line("  Username: {$username}");
        $this->line('  Password length: '.strlen($password).' characters');
        $this->line('  Password first 3 chars: '.substr($password, 0, 3).'...');
        $this->line('  Password last 3 chars: ...'.substr($password, -3));
        $this->newLine();

        // Recommendations
        $this->warn('Next Steps:');
        $this->line('1. Verify the password in KAS webmail settings matches exactly');
        $this->line('2. Check if the email account is active and not locked');
        $this->line('3. Try logging into webmail with these exact credentials');
        $this->line('4. Check KAS control panel for any IP restrictions or security settings');
        $this->line('5. Contact KAS support if the issue persists - provide them the error message');

        return self::SUCCESS;
    }
}
