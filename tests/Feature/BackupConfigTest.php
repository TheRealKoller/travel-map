<?php

use Spatie\Backup\Notifications\Notifications\BackupHasFailedNotification;
use Spatie\Backup\Notifications\Notifications\CleanupHasFailedNotification;
use Spatie\Backup\Notifications\Notifications\UnhealthyBackupWasFoundNotification;
use Spatie\Backup\Tasks\Cleanup\Strategies\DefaultStrategy;
use Spatie\Backup\Tasks\Monitor\HealthChecks\MaximumAgeInDays;
use Spatie\Backup\Tasks\Monitor\HealthChecks\MaximumStorageInMegabytes;

it('only backs up the database (no files)', function () {
    expect(config('backup.backup.source.files.include'))->toBe([]);
});

it('stores backups on the local disk', function () {
    expect(config('backup.backup.destination.disks'))->toBe(['local']);
});

it('only notifies on failure events', function () {
    $notifications = array_keys(config('backup.notifications.notifications'));

    expect($notifications)
        ->toContain(BackupHasFailedNotification::class)
        ->toContain(UnhealthyBackupWasFoundNotification::class)
        ->toContain(CleanupHasFailedNotification::class)
        ->toHaveCount(3);
});

it('sends failure notifications to MAIL_FROM_ADDRESS', function () {
    expect(config('backup.notifications.mail.to'))->toBe(env('MAIL_FROM_ADDRESS', 'hello@example.com'));
});

it('uses the correct health check thresholds', function () {
    $healthChecks = config('backup.monitor_backups.0.health_checks');

    expect($healthChecks)
        ->toHaveKey(MaximumAgeInDays::class)
        ->toHaveKey(MaximumStorageInMegabytes::class);

    expect($healthChecks[MaximumAgeInDays::class])->toBe(2);
    expect($healthChecks[MaximumStorageInMegabytes::class])->toBe(512);
});

it('uses the default cleanup strategy with 14-day retention', function () {
    expect(config('backup.cleanup.strategy'))->toBe(DefaultStrategy::class);
    expect(config('backup.cleanup.default_strategy.keep_all_backups_for_days'))->toBe(14);
});

it('disables all other retention periods', function () {
    $strategy = config('backup.cleanup.default_strategy');

    expect($strategy['keep_daily_backups_for_days'])->toBe(0)
        ->and($strategy['keep_weekly_backups_for_weeks'])->toBe(0)
        ->and($strategy['keep_monthly_backups_for_months'])->toBe(0)
        ->and($strategy['keep_yearly_backups_for_years'])->toBe(0);
});

it('limits storage to 512 MB', function () {
    expect(config('backup.cleanup.default_strategy.delete_oldest_backups_when_using_more_megabytes_than'))->toBe(512);
});

it('schedules backup commands via the Laravel scheduler', function () {
    $schedule = app(\Illuminate\Console\Scheduling\Schedule::class);

    $commands = collect($schedule->events())
        ->map(fn ($event) => $event->command ?? '')
        ->filter(fn ($cmd) => str_contains($cmd, 'backup:'))
        ->values()
        ->all();

    expect(collect($commands)->contains(fn ($cmd) => str_contains($cmd, 'backup:clean')))->toBeTrue();
    expect(collect($commands)->contains(fn ($cmd) => str_contains($cmd, 'backup:run')))->toBeTrue();
});
