<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

test('admin seeder creates admin user from env', function () {
    config(['app.env' => 'testing']);
    putenv('ADMIN_EMAIL=admin@test.com');
    putenv('ADMIN_PASSWORD=password123');
    putenv('ADMIN_NAME=Test Admin');

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->expectsOutput('Admin user created: admin@test.com')
        ->assertSuccessful();

    $this->assertDatabaseHas('users', [
        'email' => 'admin@test.com',
        'name' => 'Test Admin',
        'role' => UserRole::Admin->value,
    ]);

    $user = User::where('email', 'admin@test.com')->first();
    expect($user->email_verified_at)->not->toBeNull();
    expect(Hash::check('password123', $user->password))->toBeTrue();

    // Clean up
    putenv('ADMIN_EMAIL');
    putenv('ADMIN_PASSWORD');
    putenv('ADMIN_NAME');
});

test('admin seeder updates existing user', function () {
    $existingUser = User::factory()->create([
        'email' => 'existing@test.com',
        'name' => 'Old Name',
        'role' => UserRole::User,
    ]);

    putenv('ADMIN_EMAIL=existing@test.com');
    putenv('ADMIN_PASSWORD=newpassword123');
    putenv('ADMIN_NAME=New Admin Name');

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->expectsOutput('Admin user updated: existing@test.com')
        ->assertSuccessful();

    $user = User::where('email', 'existing@test.com')->first();
    expect($user->name)->toBe('New Admin Name');
    expect($user->role)->toBe(UserRole::Admin);
    expect(Hash::check('newpassword123', $user->password))->toBeTrue();

    // Clean up
    putenv('ADMIN_EMAIL');
    putenv('ADMIN_PASSWORD');
    putenv('ADMIN_NAME');
});

test('admin seeder warns when env variables are missing', function () {
    putenv('ADMIN_EMAIL');
    putenv('ADMIN_PASSWORD');
    putenv('ADMIN_NAME');

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->expectsOutput('Admin user configuration missing in .env file.')
        ->expectsOutput('Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME to create an admin user.')
        ->assertSuccessful();

    $this->assertDatabaseMissing('users', [
        'role' => UserRole::Admin->value,
    ]);
});

test('admin seeder sets email_verified_at', function () {
    putenv('ADMIN_EMAIL=verified@test.com');
    putenv('ADMIN_PASSWORD=password123');
    putenv('ADMIN_NAME=Verified Admin');

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->assertSuccessful();

    $user = User::where('email', 'verified@test.com')->first();
    expect($user->email_verified_at)->not->toBeNull();

    // Clean up
    putenv('ADMIN_EMAIL');
    putenv('ADMIN_PASSWORD');
    putenv('ADMIN_NAME');
});
