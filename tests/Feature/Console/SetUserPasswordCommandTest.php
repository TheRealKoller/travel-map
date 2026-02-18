<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('command can change password via email', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
        'name' => 'Test User',
        'password' => Hash::make('oldpassword'),
    ]);

    $this->artisan('user:set-password', [
        '--email' => 'user@example.com',
        '--password' => 'newpassword123',
    ])
        ->expectsOutput('Password updated successfully for Test User (user@example.com)')
        ->assertSuccessful();

    $user->refresh();
    expect(Hash::check('newpassword123', $user->password))->toBeTrue();
    expect(Hash::check('oldpassword', $user->password))->toBeFalse();
});

test('command can change password via user ID', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
        'name' => 'Test User',
        'password' => Hash::make('oldpassword'),
    ]);

    $this->artisan('user:set-password', [
        '--id' => $user->id,
        '--password' => 'newpassword456',
    ])
        ->expectsOutput('Password updated successfully for Test User (user@example.com)')
        ->assertSuccessful();

    $user->refresh();
    expect(Hash::check('newpassword456', $user->password))->toBeTrue();
});

test('command validates password minimum length', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
    ]);

    $this->artisan('user:set-password', [
        '--email' => 'user@example.com',
        '--password' => 'short',
    ])
        ->assertFailed();

    $user->refresh();
    expect(Hash::check('short', $user->password))->toBeFalse();
});

test('command shows error for non-existent user via email', function () {
    $this->artisan('user:set-password', [
        '--email' => 'nonexistent@example.com',
        '--password' => 'password123',
    ])
        ->expectsOutput('User not found: nonexistent@example.com')
        ->assertFailed();
});

test('command shows error for non-existent user via ID', function () {
    $this->artisan('user:set-password', [
        '--id' => 99999,
        '--password' => 'password123',
    ])
        ->expectsOutput('User not found: ID 99999')
        ->assertFailed();
});

test('command shows error when neither email nor ID provided', function () {
    $this->artisan('user:set-password', [
        '--password' => 'password123',
    ])
        ->expectsOutput('You must provide either --email or --id option.')
        ->assertFailed();
});

test('command shows error when both email and ID provided', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
    ]);

    $this->artisan('user:set-password', [
        '--email' => 'user@example.com',
        '--id' => $user->id,
        '--password' => 'password123',
    ])
        ->expectsOutput('You cannot provide both --email and --id options. Please use only one.')
        ->assertFailed();
});

test('command can change admin password', function () {
    $admin = User::factory()->admin()->create([
        'email' => 'admin@example.com',
        'name' => 'Admin User',
        'password' => Hash::make('oldadminpass'),
    ]);

    $this->artisan('user:set-password', [
        '--email' => 'admin@example.com',
        '--password' => 'newadminpass123',
    ])
        ->expectsOutput('Password updated successfully for Admin User (admin@example.com)')
        ->assertSuccessful();

    $admin->refresh();
    expect(Hash::check('newadminpass123', $admin->password))->toBeTrue();
    expect($admin->role)->toBe(UserRole::Admin);
});

test('command shows warning when password option is used', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
    ]);

    $this->artisan('user:set-password', [
        '--email' => 'user@example.com',
        '--password' => 'password123',
    ])
        ->expectsOutput('Warning: Passing passwords via command line options can expose them in shell history and process listings.')
        ->expectsOutput('Consider using the interactive mode instead for better security.')
        ->assertSuccessful();
});

test('command works interactively without password option', function () {
    $user = User::factory()->create([
        'email' => 'user@example.com',
        'name' => 'Test User',
        'password' => Hash::make('oldpassword'),
    ]);

    $this->artisan('user:set-password', [
        '--email' => 'user@example.com',
    ])
        ->expectsQuestion('New password', 'interactivepassword123')
        ->expectsOutput('Password updated successfully for Test User (user@example.com)')
        ->assertSuccessful();

    $user->refresh();
    expect(Hash::check('interactivepassword123', $user->password))->toBeTrue();
});

test('new password works for login', function () {
    $user = User::factory()->create([
        'email' => 'login@example.com',
        'password' => Hash::make('oldpassword'),
    ]);

    // Change password
    $this->artisan('user:set-password', [
        '--email' => 'login@example.com',
        '--password' => 'newloginpass123',
    ])
        ->assertSuccessful();

    // Verify new password works
    $user->refresh();
    expect(Hash::check('newloginpass123', $user->password))->toBeTrue();

    // Verify old password doesn't work
    expect(Hash::check('oldpassword', $user->password))->toBeFalse();
});
