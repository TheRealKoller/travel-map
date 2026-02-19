# Email Configuration Documentation

## Overview

### Purpose

The TravelMap application uses email functionality primarily for **user invitation management**. When administrators invite new users to the platform, invitation emails are sent via a queued email system to ensure reliable delivery without blocking the application.

### Architecture

- **Email System**: Laravel Mail with SMTP transport
- **Queue System**: Laravel Queue with database driver
- **SMTP Provider**: all-inkl.com
- **Environments**: Development (DEV) and Production (PROD)

### Key Components

1. **Mail Service**: `UserInvitationMail` - Queued Mailable class
2. **Queue Worker**: Background process that processes email jobs
3. **SMTP Server**: all-inkl.com SMTP server for email delivery
4. **Queue Control Script**: `scripts/queue-worker-control.sh` for worker management

---

## GitHub Secrets/Variables Setup

Email configuration is managed through GitHub Secrets (sensitive data) and Variables (non-sensitive data) for both DEV and PROD environments.

### Required GitHub Variables (Non-Sensitive)

Navigate to: **Repository Settings → Environments → development → Variables** and **Repository Settings → Environments → production → Variables**.  
For detailed setup steps, see [GitHub environments setup](./GITHUB-ENVIRONMENTS-SETUP.md).

#### Development Environment Variables

| Variable Name       | Example Value                 | Description                                                                                     |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `MAIL_MAILER`       | `smtp`                        | Mail driver (use `smtp` for production email)                                                   |
| `MAIL_SCHEME`       | `null`                        | Symfony mailer scheme (leave `null` for STARTTLS on port 587, or set `ssl` when using 465)      |
| `MAIL_HOST`         | `smtp.kasserver.com`          | all-inkl.com SMTP server hostname                                                               |
| `MAIL_PORT`         | `587`                         | SMTP port (587 with `MAIL_SCHEME=null`, or 465 with `MAIL_SCHEME=ssl` if your provider uses it) |
| `MAIL_USERNAME`     | `<your-email@yourdomain.com>` | SMTP username (your email address)                                                              |
| `MAIL_FROM_ADDRESS` | `<noreply@yourdomain.com>`    | "From" email address in sent emails                                                             |
| `MAIL_FROM_NAME`    | `TravelMap DEV`               | "From" name in sent emails                                                                      |

#### Production Environment Variables

| Variable Name       | Example Value                 | Description                                                                                     |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `MAIL_MAILER`       | `smtp`                        | Mail driver (use `smtp` for production email)                                                   |
| `MAIL_SCHEME`       | `null`                        | Symfony mailer scheme (leave `null` for STARTTLS on port 587, or set `ssl` when using 465)      |
| `MAIL_HOST`         | `smtp.kasserver.com`          | all-inkl.com SMTP server hostname                                                               |
| `MAIL_PORT`         | `587`                         | SMTP port (587 with `MAIL_SCHEME=null`, or 465 with `MAIL_SCHEME=ssl` if your provider uses it) |
| `MAIL_USERNAME`     | `<your-email@yourdomain.com>` | SMTP username (your email address)                                                              |
| `MAIL_FROM_ADDRESS` | `<noreply@yourdomain.com>`    | "From" email address in sent emails                                                             |
| `MAIL_FROM_NAME`    | `TravelMap`                   | "From" name in sent emails                                                                      |

### Required GitHub Secrets (Sensitive)

Navigate to: **Repository Settings → Environments → development → Secrets** and **Repository Settings → Environments → production → Secrets**

#### Development Environment Secrets

| Secret Name     | Description                     |
| --------------- | ------------------------------- |
| `MAIL_PASSWORD` | SMTP password from all-inkl.com |

#### Production Environment Secrets

| Secret Name     | Description                     |
| --------------- | ------------------------------- |
| `MAIL_PASSWORD` | SMTP password from all-inkl.com |

### Step-by-Step GitHub UI Instructions

#### Adding Variables

1. Go to your GitHub repository.
2. Click **Settings** → **Environments**.
3. Click the environment name (e.g., `development` or `production`). Create it first if it does not exist.
4. In the environment page, scroll to the **Environment variables** section.
5. Click **Add variable**.
6. Enter the variable name (e.g., `MAIL_MAILER`).
7. Enter the value (e.g., `smtp`).
8. Click **Save**.
9. Repeat for all variables listed above for each environment.

#### Adding Secrets

1. Go to your GitHub repository.
2. Click **Settings** → **Environments**.
3. Click the environment name (e.g., `development` or `production`). Create it first if it does not exist.
4. In the environment page, scroll to the **Environment secrets** section.
5. Click **Add secret**.
6. Enter the secret name (e.g., `MAIL_PASSWORD`).
7. Enter the secret value (your SMTP password).
8. Click **Save**.

---

## all-inkl.com SMTP Configuration

### Obtaining SMTP Credentials

1. **Login to all-inkl.com KAS (Kunden-Administrations-System)**
    - Navigate to: https://kas.all-inkl.com/

2. **Navigate to Email Settings**
    - Go to **Domain** → **Email addresses**
    - Select or create an email address for SMTP

3. **Get SMTP Settings**
    - Click on the email address
    - Note down the SMTP server and authentication details

### Recommended SMTP Settings

#### STARTTLS Configuration (Recommended - Default for this project)

```
MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=smtp.kasserver.com
MAIL_PORT=587
MAIL_USERNAME=<your-email@yourdomain.com>
MAIL_PASSWORD=<your-smtp-password>
MAIL_FROM_ADDRESS=<noreply@yourdomain.com>
MAIL_FROM_NAME="TravelMap"
```

#### SSL Configuration (Alternative)

```
MAIL_MAILER=smtp
MAIL_SCHEME=ssl
MAIL_HOST=smtp.kasserver.com
MAIL_PORT=465
MAIL_USERNAME=<your-email@yourdomain.com>
MAIL_PASSWORD=<your-smtp-password>
MAIL_FROM_ADDRESS=<noreply@yourdomain.com>
MAIL_FROM_NAME="TravelMap"
```

### Common Configuration Values

| Setting        | Value                | Notes                                                    |
| -------------- | -------------------- | -------------------------------------------------------- |
| SMTP Server    | `smtp.kasserver.com` | all-inkl.com standard SMTP server                        |
| STARTTLS Port  | `587`                | Use with `MAIL_SCHEME=null` (recommended, default setup) |
| SSL Port       | `465`                | Use with `MAIL_SCHEME=ssl` (alternative)                 |
| Authentication | Required             | Always use username/password                             |

### Security Best Practices

1. **Never commit SMTP credentials to version control**
    - Always use GitHub Secrets for passwords
    - Keep `.env` files out of git (already in `.gitignore`)

2. **Use dedicated email addresses**
    - Create a separate `noreply@yourdomain.com` for automated emails
    - Don't use personal email addresses for application emails

3. **Rotate credentials periodically**
    - Change SMTP passwords every 6-12 months
    - Update GitHub Secrets when credentials change

4. **Monitor email sending**
    - Check all-inkl.com email logs regularly
    - Watch for bounce rates and delivery issues

---

## Queue Worker Management

### How Queue Workers Work

Queue workers are background processes that continuously check the `jobs` table in the database for pending email jobs and process them. This ensures that email sending doesn't block the web application.

**Key Configuration:**

- Queue connection: `database` (stored in `jobs` table)
- Queue driver: Laravel's database queue
- Worker script: `scripts/queue-worker-control.sh`
- Worker options: `--connection=database --queue=default --sleep=3 --tries=3 --max-jobs=1000 --timeout=60`

### Queue Worker Control Script

The application includes a comprehensive queue worker management script at `scripts/queue-worker-control.sh`.

#### Available Commands

```bash
# Start queue worker
./scripts/queue-worker-control.sh start

# Stop queue worker
./scripts/queue-worker-control.sh stop

# Restart queue worker (graceful)
./scripts/queue-worker-control.sh restart

# Check worker status
./scripts/queue-worker-control.sh status
```

### Worker Lifecycle

**During Deployment:**

1. Deployment workflow calls `./scripts/queue-worker-control.sh restart`
2. Laravel issues a `queue:restart` command
3. Current worker finishes processing current job (max 60 seconds)
4. Worker shuts down gracefully
5. New worker starts automatically with updated code

**⚠️ Important Note:** The current deployment workflows exclude the `scripts` directory from the deployment package. This means `scripts/queue-worker-control.sh` must already exist on the server, or you must manually upload it when setting up a new server. If you modify the script, you'll need to manually update it on the server via SSH, or adjust the deployment rsync exclusions to include `scripts`.

**Worker Options Explained:**

- `--connection=database`: Use database queue
- `--queue=default`: Process default queue
- `--sleep=3`: Wait 3 seconds when no jobs (prevents CPU spinning)
- `--tries=3`: Retry failed jobs up to 3 times
- `--max-jobs=1000`: Restart worker after 1000 jobs (prevents memory leaks)
- `--timeout=60`: Job timeout (must be less than `retry_after=90s`)

### Log File Location

**Queue Worker Logs:**

```
storage/logs/queue-worker.log
```

**Laravel Application Logs:**

```
storage/logs/laravel-{date}.log  # When LOG_CHANNEL=daily
storage/logs/laravel.log          # When LOG_CHANNEL=single
```

### Reading Queue Logs

```bash
# SSH into the server
ssh <user>@<host>

# Navigate to project directory
cd /path/to/travelmap

# View last 50 lines of queue worker log
tail -n 50 storage/logs/queue-worker.log

# Follow queue worker log in real-time
tail -f storage/logs/queue-worker.log

# View Laravel application logs
tail -n 50 storage/logs/laravel.log

# Search for email-related errors
grep -i "mail\|smtp\|queue" storage/logs/laravel.log
```

### Manual Worker Management via SSH

```bash
# Check if worker is running
./scripts/queue-worker-control.sh status

# Start worker manually
./scripts/queue-worker-control.sh start

# Restart worker after configuration changes
./scripts/queue-worker-control.sh restart

# Stop worker
./scripts/queue-worker-control.sh stop
```

### Troubleshooting Worker Issues

#### Worker Not Starting

```bash
# Check for errors in worker log
tail -n 100 storage/logs/queue-worker.log

# Check Laravel logs for PHP errors
tail -n 100 storage/logs/laravel.log

# Verify PHP CLI is working
php artisan --version

# Try starting manually with verbose output
php artisan queue:work --connection=database --verbose
```

#### Worker Running But Not Processing Jobs

```bash
# Check if jobs exist in database
php artisan tinker
> \DB::table('jobs')->count();

# Check failed jobs
php artisan queue:failed

# Restart worker
./scripts/queue-worker-control.sh restart
```

#### Multiple Workers Running (Orphaned Processes)

```bash
# Check status (will show orphaned processes)
./scripts/queue-worker-control.sh status

# Stop all workers (cleans up orphaned processes)
./scripts/queue-worker-control.sh stop

# Start fresh worker
./scripts/queue-worker-control.sh start
```

---

## Local Development

### Why `MAIL_MAILER=log` is Used Locally

In your local `.env` file, email is configured to use the `log` driver instead of SMTP:

```bash
MAIL_MAILER=log
```

**Reasons:**

1. **No real emails sent**: Prevents accidentally sending emails during development
2. **Faster testing**: No SMTP connection overhead
3. **Easy debugging**: Emails are written to `storage/logs/laravel.log`
4. **No credentials needed**: No SMTP username/password required locally

### Testing Emails Locally

#### View Logged Emails

When `MAIL_MAILER=log`, emails are written to Laravel logs:

```bash
# View recent emails
tail -n 100 storage/logs/laravel.log | grep -A 20 "Message-ID:"

# Watch for new emails in real-time
tail -f storage/logs/laravel.log
```

**⚠️ Important for Queued Emails:** Invitation emails are queued via `Mail::to(...)->queue(...)`. With the default local `QUEUE_CONNECTION=database`, emails won't be logged until a queue worker processes them. To see logged emails locally, you have two options:

1. **Run a queue worker locally:**

    ```bash
    php artisan queue:work
    ```

2. **Temporarily use sync queue (no worker needed):**
    ```bash
    # In your .env
    QUEUE_CONNECTION=sync
    ```

#### Send Test Invitation

1. Access the admin invitation page: `http://localhost:8000/admin/invitations`
2. Enter a test email address
3. Click "Send Invitation"
4. Check `storage/logs/laravel.log` for the email content

#### Using Laravel Tinker for Email Testing

```bash
php artisan tinker

# Create a test invitation
$invitation = new \App\Models\UserInvitation([
    'email' => 'test@example.com',
    'role' => \App\Enums\UserRole::User,
    'token' => \App\Models\UserInvitation::generateToken(),
    'invited_by' => 1,
    'expires_at' => now()->addDays(7)
]);
$invitation->save();

# Send test email (will be logged)
\Mail::to('test@example.com')->send(new \App\Mail\UserInvitationMail($invitation));

# Check if queued job was created
\DB::table('jobs')->count();
```

### Using Laravel's Mail Testing Features

Laravel provides excellent mail testing features with `Mail::fake()`:

```php
use Illuminate\Support\Facades\Mail;
use App\Mail\UserInvitationMail;

// In your test file
Mail::fake();

// Perform action that sends email
$response = $this->post('/admin/invitations', [
    'email' => 'test@example.com',
    'role' => 'user'
]);

// Assert email was queued
Mail::assertQueued(UserInvitationMail::class, function ($mail) {
    return $mail->hasTo('test@example.com');
});
```

---

## Troubleshooting

### Emails Not Being Sent

#### Check 1: Queue Worker Status

```bash
ssh <user>@<host>
cd /path/to/travelmap
./scripts/queue-worker-control.sh status
```

**Expected Output:**

```
✅ Queue worker is running
   PID: 12345
   Log: /path/to/storage/logs/queue-worker.log
```

**Fix if not running:**

```bash
./scripts/queue-worker-control.sh start
```

#### Check 2: Jobs in Database

```bash
php artisan tinker
> \DB::table('jobs')->count();  # Should be 0 if processing
> \DB::table('failed_jobs')->count();  # Should be 0 if no failures
```

#### Check 3: Failed Jobs

```bash
php artisan queue:failed
```

**Fix if failed jobs exist:**

```bash
# View specific failed job details
php artisan queue:failed --id=<job-id>

# Retry all failed jobs
php artisan queue:retry all

# Clear failed jobs (after fixing issue)
php artisan queue:flush
```

#### Check 4: SMTP Configuration

```bash
# Test SMTP connection with tinker
php artisan tinker

> \Mail::raw('Test email', function($msg) {
    $msg->to('your-email@example.com')->subject('Test');
});
```

### Queue Workers Not Running

#### Symptoms

- Jobs accumulate in `jobs` table
- Emails not being sent
- `queue-worker.log` not updating

#### Diagnosis

```bash
# Check worker status
./scripts/queue-worker-control.sh status

# Check for PHP errors
tail -n 50 storage/logs/laravel.log

# Check worker log
tail -n 50 storage/logs/queue-worker.log
```

#### Solution

```bash
# Restart worker
./scripts/queue-worker-control.sh restart

# If restart fails, stop and start manually
./scripts/queue-worker-control.sh stop
sleep 2
./scripts/queue-worker-control.sh start
```

### Authentication Failures

#### Error Messages

```
Failed to authenticate on SMTP server
535 Incorrect authentication data
```

#### Solutions

1. **Verify SMTP credentials in GitHub Secrets**
    - Check `MAIL_USERNAME` and `MAIL_PASSWORD`
    - Ensure no extra spaces or special characters

2. **Test credentials manually**

    ```bash
    # Use telnet or openssl to test SMTP auth
    openssl s_client -connect smtp.kasserver.com:465 -crlf
    ```

3. **Check all-inkl.com account**
    - Verify email address exists
    - Check if SMTP access is enabled
    - Try resetting password

4. **Update GitHub Secrets**
    - Go to GitHub repository settings
    - Update `MAIL_PASSWORD` secret
    - Re-deploy to apply changes

### Connection Timeouts

#### Error Messages

```
Connection to smtp.kasserver.com:465 timed out
```

#### Solutions

1. **Check server firewall**

    ```bash
    # Test SMTP port connectivity
    telnet smtp.kasserver.com 465
    nc -zv smtp.kasserver.com 465
    ```

2. **Verify SMTP settings**
    - Correct port: 465 for SSL, 587 for TLS
    - Correct hostname: `smtp.kasserver.com`
    - Matching `MAIL_SCHEME` and port

3. **Check all-inkl.com server status**
    - Visit all-inkl.com status page
    - Contact all-inkl.com support if server is down

### Failed Jobs in Queue

#### View Failed Jobs

```bash
php artisan queue:failed
```

#### Analyze Failed Job

```bash
php artisan queue:failed --id=<job-id>
```

#### Retry Failed Jobs

```bash
# Retry specific job
php artisan queue:retry <job-id>

# Retry all failed jobs
php artisan queue:retry all
```

#### Clear Failed Jobs

```bash
# Clear all failed jobs (after fixing the issue)
php artisan queue:flush
```

### Checking Email Logs

#### Laravel Logs

```bash
# View recent email activity
tail -n 100 storage/logs/laravel.log | grep -i mail

# Follow logs in real-time
tail -f storage/logs/laravel.log
```

#### Queue Worker Logs

```bash
# View recent worker activity
tail -n 100 storage/logs/queue-worker.log

# Follow worker logs in real-time
tail -f storage/logs/queue-worker.log
```

#### all-inkl.com Email Logs

1. Login to KAS: https://kas.all-inkl.com/
2. Navigate to **Email** → **Email Logs**
3. Filter by date and sender address
4. Check for bounces and delivery failures

### Manually Processing Queue

#### Process One Job

```bash
php artisan queue:work --once
```

#### Process Jobs for 60 Seconds

```bash
php artisan queue:work --max-time=60
```

#### Process Specific Queue

```bash
php artisan queue:work --queue=default
```

---

## Testing Email Functionality

### Test on Development Environment

#### 1. Send Test Invitation

1. Access DEV environment: https://dev.travelmap.koller.dk/
2. Login as administrator
3. Navigate to **Admin** → **User Invitations**
4. Enter a test email address
5. Click **Send Invitation**
6. Verify success message appears

#### 2. Verify Email Delivery

```bash
# SSH into DEV server
ssh <dev-user>@<dev-host>

# Check queue worker status
cd /path/to/dev/travelmap
./scripts/queue-worker-control.sh status

# Check queue logs
tail -n 50 storage/logs/queue-worker.log

# Check Laravel logs for email sending
tail -n 50 storage/logs/laravel.log | grep -i mail
```

#### 3. Check Email Inbox

- Check the test email inbox
- Verify invitation email received
- Click invitation link to test registration flow

### Test on Production Environment

**⚠️ IMPORTANT: Only test on PROD after successful DEV testing**

#### Pre-Production Checklist

- [ ] Email tested successfully on DEV
- [ ] Queue worker confirmed running on DEV
- [ ] SMTP credentials verified on PROD GitHub Secrets
- [ ] Email sending limits checked with all-inkl.com

#### Production Test Procedure

1. Access PROD environment: https://travelmap.koller.dk/
2. Login as administrator
3. Navigate to **Admin** → **User Invitations**
4. **Use your own email address for testing**
5. Send test invitation
6. Verify email received
7. Monitor queue worker logs for any issues

#### Post-Test Verification

```bash
# SSH into PROD server
ssh <prod-user>@<prod-host>

# Verify no failed jobs
cd /path/to/prod/travelmap
php artisan queue:failed

# Check worker status
./scripts/queue-worker-control.sh status
```

---

## Maintenance

### Monitoring Queue Health

#### Daily Checks

```bash
# Check worker status
./scripts/queue-worker-control.sh status

# Check for failed jobs
php artisan queue:failed

# Check job count in database
php artisan tinker
> \DB::table('jobs')->count();  # Should be low (< 100)
> \DB::table('failed_jobs')->count();  # Should be 0
```

#### Weekly Checks

```bash
# Check log file sizes
du -sh storage/logs/*.log

# Check queue worker uptime
ps -p $(cat storage/framework/queue-worker.pid) -o etime=

# Review failed job history
php artisan queue:failed
```

#### Monthly Checks

- Review all-inkl.com email sending statistics
- Check for email bounces and complaints
- Verify SMTP credentials still working
- Review and archive old log files

### Clearing Failed Jobs

```bash
# View failed jobs
php artisan queue:failed

# Analyze failure reasons
php artisan queue:failed --id=<job-id>

# Retry specific failed job (after fixing issue)
php artisan queue:retry <job-id>

# Retry all failed jobs
php artisan queue:retry all

# Clear failed jobs (after investigation)
php artisan queue:flush
```

### Restarting Workers After Issues

#### After Configuration Changes

```bash
# Restart worker gracefully (finishes current jobs)
./scripts/queue-worker-control.sh restart
```

#### After Application Update

```bash
# Workers are automatically restarted during deployment
# Manual restart if needed:
./scripts/queue-worker-control.sh restart
```

#### After Server Reboot

```bash
# Workers don't auto-start after reboot
# Manually start worker:
./scripts/queue-worker-control.sh start
```

### Updating SMTP Credentials

#### Step-by-Step Process

1. **Update credentials in all-inkl.com**
    - Login to KAS
    - Change SMTP password if needed

2. **Update GitHub Secrets**
    - Go to repository Settings → Secrets
    - Update `MAIL_PASSWORD` for DEV and PROD environments
    - Update `MAIL_USERNAME` if email address changed

3. **Re-deploy to apply changes**

    ```bash
    # For DEV (automatic on push to main)
    git push origin main

    # For PROD (manual workflow dispatch)
    # Go to GitHub Actions → Deploy to PROD → Run workflow
    ```

4. **Verify new credentials work**
    ```bash
    # SSH into server after deployment
    php artisan tinker
    > \Mail::raw('Test', function($msg) {
        $msg->to('your-email@example.com')->subject('Test');
    });
    ```

---

## Additional Resources

### Laravel Documentation

- [Laravel Mail](https://laravel.com/docs/12.x/mail) - Official mail documentation
- [Laravel Queues](https://laravel.com/docs/12.x/queues) - Official queue documentation
- [Laravel Queue Workers](https://laravel.com/docs/12.x/queues#running-the-queue-worker) - Worker management

### all-inkl.com Resources

- [all-inkl.com KAS Login](https://kas.all-inkl.com/)
- [all-inkl.com Support](https://all-inkl.com/wichtig/anleitungen/)

### Project Documentation

- [GITHUB-SECRETS.md](./GITHUB-SECRETS.md) - Complete GitHub Secrets reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment procedures
- [PIPELINE.md](./PIPELINE.md) - CI/CD pipeline documentation

---

## Summary

This document provides comprehensive guidance for configuring, managing, and troubleshooting the email system in TravelMap. Key takeaways:

1. **Email sending is queued** - Uses database queue with background worker
2. **SMTP via all-inkl.com** - Reliable email delivery with SSL/TLS
3. **GitHub Secrets management** - Credentials stored securely, never in code
4. **Queue worker script** - Easy worker management via `queue-worker-control.sh`
5. **Local development** - Uses `MAIL_MAILER=log` to prevent real emails
6. **Comprehensive troubleshooting** - Step-by-step solutions for common issues

For questions or issues not covered in this documentation, check the Laravel documentation or contact the development team.
