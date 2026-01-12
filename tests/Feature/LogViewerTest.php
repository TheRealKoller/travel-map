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

    // Create a test log file with sample entries
    $logPath = storage_path('logs/laravel.log');
    $logContent = <<<'LOG'
[2026-01-12 09:00:00] local.INFO: Test info message
[2026-01-12 10:00:00] local.ERROR: Test error message
Stack trace:
#0 /path/to/file.php(10): TestClass->method()
#1 {main}
LOG;

    // Backup existing log
    $backup = null;
    if (file_exists($logPath)) {
        $backup = file_get_contents($logPath);
    }

    // Write test log
    file_put_contents($logPath, $logContent);

    $response = $this->actingAs($user)->get(route('logs'));

    // Restore backup
    if ($backup !== null) {
        file_put_contents($logPath, $backup);
    } else {
        unlink($logPath);
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
