<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('create admin command works with options', function () {
    $this->artisan('user:create-admin', [
        '--email' => 'admin@example.com',
        '--name' => 'Admin User',
        '--password' => 'password123',
    ])
        ->expectsOutput('Admin user created: admin@example.com')
        ->assertSuccessful();

    $this->assertDatabaseHas('users', [
        'email' => 'admin@example.com',
        'name' => 'Admin User',
        'role' => UserRole::Admin->value,
    ]);

    $user = User::where('email', 'admin@example.com')->first();
    expect($user->email_verified_at)->not->toBeNull();
    expect(Hash::check('password123', $user->password))->toBeTrue();
});

test('create admin command works interactively', function () {
    $this->artisan('user:create-admin')
        ->expectsQuestion('Email address', 'interactive@example.com')
        ->expectsQuestion('Name', 'Interactive Admin')
        ->expectsQuestion('Password', 'securepass123')
        ->expectsOutput('Admin user created: interactive@example.com')
        ->assertSuccessful();

    $this->assertDatabaseHas('users', [
        'email' => 'interactive@example.com',
        'name' => 'Interactive Admin',
        'role' => UserRole::Admin->value,
    ]);
});

test('create admin command validates email', function () {
    $this->artisan('user:create-admin', [
        '--email' => 'invalid-email',
        '--name' => 'Admin',
        '--password' => 'password123',
    ])
        ->expectsOutput('Invalid email address.')
        ->assertFailed();
});

test('create admin command validates password length', function () {
    $this->artisan('user:create-admin', [
        '--email' => 'admin@example.com',
        '--name' => 'Admin',
        '--password' => 'short',
    ])
        ->expectsOutput('Password must be at least 8 characters long.')
        ->assertFailed();
});

test('create admin command can upgrade existing user', function () {
    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'name' => 'Regular User',
        'role' => UserRole::User,
    ]);

    $this->artisan('user:create-admin', [
        '--email' => 'existing@example.com',
        '--name' => 'Admin User',
        '--password' => 'newpassword123',
    ])
        ->expectsQuestion('User existing@example.com already exists. Upgrade to admin?', true)
        ->expectsOutput('User updated to admin: existing@example.com')
        ->assertSuccessful();

    $user = User::where('email', 'existing@example.com')->first();
    expect($user->role)->toBe(UserRole::Admin);
    expect($user->name)->toBe('Admin User');
    expect(Hash::check('newpassword123', $user->password))->toBeTrue();
});

test('create admin command can cancel upgrade', function () {
    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'role' => UserRole::User,
    ]);

    $this->artisan('user:create-admin', [
        '--email' => 'existing@example.com',
        '--name' => 'Admin User',
        '--password' => 'password123',
    ])
        ->expectsQuestion('User existing@example.com already exists. Upgrade to admin?', false)
        ->expectsOutput('Operation cancelled.')
        ->assertSuccessful();

    $user = User::where('email', 'existing@example.com')->first();
    expect($user->role)->toBe(UserRole::User);
});

test('create admin command recognizes existing admin', function () {
    User::factory()->admin()->create([
        'email' => 'admin@example.com',
    ]);

    $this->artisan('user:create-admin', [
        '--email' => 'admin@example.com',
        '--name' => 'Admin',
        '--password' => 'password123',
    ])
        ->expectsOutput('User admin@example.com is already an admin.')
        ->assertSuccessful();
});

test('create admin command sets email_verified_at', function () {
    $this->artisan('user:create-admin', [
        '--email' => 'verified@example.com',
        '--name' => 'Verified Admin',
        '--password' => 'password123',
    ])
        ->assertSuccessful();

    $user = User::where('email', 'verified@example.com')->first();
    expect($user->email_verified_at)->not->toBeNull();
});
