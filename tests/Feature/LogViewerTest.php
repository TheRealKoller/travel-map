<?php

use App\Models\User;

it('can access logs page when authenticated', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('logs'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Logs/Index')
        ->has('logs')
        ->has('totalLines')
    );
});

it('cannot access logs page when not authenticated', function () {
    $response = $this->get(route('logs'));

    $response->assertRedirect(route('login'));
});

it('parses log entries correctly', function () {
    $user = User::factory()->create();

    // Create test log files with sample entries (both default and dated filenames)
    $logsDir = storage_path('logs');
    if (! is_dir($logsDir)) {
        mkdir($logsDir, 0777, true);
    }

    $logPaths = [
        storage_path('logs/laravel.log'),
        storage_path('logs/laravel-2999-01-01.log'),
    ];

    $logContent = <<<'LOG'
[2026-01-12 09:00:00] local.INFO: Test info message
[2026-01-12 10:00:00] local.ERROR: Test error message
Stack trace:
#0 /path/to/file.php(10): TestClass->method()
#1 {main}
LOG;

    // Backup existing logs and write test content to both possible filenames
    $backups = [];
    foreach ($logPaths as $logPath) {
        $backups[$logPath] = file_exists($logPath) ? file_get_contents($logPath) : null;
        file_put_contents($logPath, $logContent);
    }

    $response = $this->actingAs($user)->get(route('logs'));

    // Restore backups (or remove created files)
    foreach ($logPaths as $logPath) {
        if ($backups[$logPath] !== null) {
            file_put_contents($logPath, $backups[$logPath]);
        } elseif (file_exists($logPath)) {
            unlink($logPath);
        }
    }

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('logs', 2)
        ->where('logs.0.level', 'ERROR')
        ->where('logs.0.message', 'Test error message')
        ->where('logs.1.level', 'INFO')
        ->where('logs.1.message', 'Test info message')
    );
});
