<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestSmtpConnection extends Command
{
    protected $signature = 'mail:test {email? : Email address to send test to}';

    protected $description = 'Test SMTP connection and mail configuration';

    public function handle(): int
    {
        $this->info('Testing SMTP Connection...');
        $this->newLine();

        // Display current mail configuration
        $this->info('Current Mail Configuration:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['MAIL_MAILER', config('mail.default')],
                ['MAIL_HOST', config('mail.mailers.smtp.host')],
                ['MAIL_PORT', config('mail.mailers.smtp.port')],
                ['MAIL_USERNAME', config('mail.mailers.smtp.username')],
                ['MAIL_PASSWORD', config('mail.mailers.smtp.password') ? '***SET***' : 'NOT SET'],
                ['MAIL_ENCRYPTION', config('mail.mailers.smtp.encryption', 'none')],
                ['MAIL_FROM_ADDRESS', config('mail.from.address')],
                ['MAIL_FROM_NAME', config('mail.from.name')],
            ]
        );

        $this->newLine();

        // Show .env values for comparison
        $this->info('Environment Variables:');
        $this->table(
            ['Variable', 'Value'],
            [
                ['MAIL_MAILER', env('MAIL_MAILER')],
                ['MAIL_HOST', env('MAIL_HOST')],
                ['MAIL_PORT', env('MAIL_PORT')],
                ['MAIL_USERNAME', env('MAIL_USERNAME')],
                ['MAIL_PASSWORD', env('MAIL_PASSWORD') ? '***SET***' : 'NOT SET'],
                ['MAIL_ENCRYPTION', env('MAIL_ENCRYPTION', 'NOT SET')],
            ]
        );

        $this->newLine();

        if (config('mail.default') === 'log') {
            $this->warn('⚠️  MAIL_MAILER is set to "log" - emails will only be logged, not sent!');
            $this->newLine();
        }

        $email = $this->argument('email') ?? config('mail.from.address');

        if (! $email || $email === 'hello@example.com') {
            $this->error('Please provide a valid email address:');
            $this->info('  php artisan mail:test your@email.com');

            return self::FAILURE;
        }

        $this->info("Attempting to send test email to: {$email}");
        $this->newLine();

        try {
            Mail::raw('This is a test email from Travel Map. If you received this, your SMTP configuration is working correctly!', function ($message) use ($email) {
                $message->to($email)
                    ->subject('Travel Map - SMTP Test Email');
            });

            $this->info('✅ Test email sent successfully!');
            $this->info("Check the inbox of {$email}");

            return self::SUCCESS;
        } catch (\Symfony\Component\Mailer\Exception\TransportException $e) {
            $this->error('❌ SMTP Transport Error:');
            $this->error($e->getMessage());
            $this->newLine();

            $this->warn('Common Issues:');
            $this->line('  1. Wrong username or password');
            $this->line('  2. Need to use an "App Password" instead of account password (Gmail, Outlook)');
            $this->line('  3. Wrong MAIL_HOST or MAIL_PORT');
            $this->line('  4. Account requires 2FA or less secure app access enabled');
            $this->line('  5. IP address blocked by mail server');
            $this->line('  6. Wrong MAIL_ENCRYPTION setting (try "tls" or "ssl")');
            $this->line('  7. For KAS servers: Password may need to be the MAIL-specific password, not main account password');
            $this->newLine();

            $this->warn('Troubleshooting Steps:');
            $this->line('  1. Verify credentials in KAS control panel (webmail settings)');
            $this->line('  2. Check if there\'s a separate "Mail Password" different from main password');
            $this->line('  3. Test manual SMTP connection: openssl s_client -connect '.config('mail.mailers.smtp.host').':'.config('mail.mailers.smtp.port').' -starttls smtp');
            $this->line('  4. Run: php artisan config:clear && php artisan cache:clear');

            return self::FAILURE;
        } catch (\Exception $e) {
            $this->error('❌ Unexpected Error:');
            $this->error($e->getMessage());
            $this->error($e->getTraceAsString());

            return self::FAILURE;
        }
    }
}
