<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Clear admin config before each test to ensure clean state
    config(['admin.user.email' => null]);
    config(['admin.user.password' => null]);
    config(['admin.user.name' => null]);
});

test('admin seeder creates admin user from config', function () {
    config([
        'admin.user.email' => 'admin@test.com',
        'admin.user.password' => 'password123',
        'admin.user.name' => 'Test Admin',
    ]);

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->assertSuccessful();

    $this->assertDatabaseHas('users', [
        'email' => 'admin@test.com',
        'name' => 'Test Admin',
        'role' => UserRole::Admin->value,
    ]);

    $user = User::where('email', 'admin@test.com')->first();
    expect($user)->not->toBeNull();
    expect($user->email_verified_at)->not->toBeNull();
    expect(Hash::check('password123', $user->password))->toBeTrue();
});

test('admin seeder updates existing user', function () {
    $existingUser = User::factory()->create([
        'email' => 'existing@test.com',
        'name' => 'Old Name',
        'role' => UserRole::User,
    ]);

    config([
        'admin.user.email' => 'existing@test.com',
        'admin.user.password' => 'newpassword123',
        'admin.user.name' => 'New Admin Name',
    ]);

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->assertSuccessful();

    $user = User::where('email', 'existing@test.com')->first();
    expect($user)->not->toBeNull();
    expect($user->name)->toBe('New Admin Name');
    expect($user->role)->toBe(UserRole::Admin);
    expect(Hash::check('newpassword123', $user->password))->toBeTrue();
});

test('admin seeder skips when config variables are missing', function () {
    // Config is cleared in beforeEach
    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->assertSuccessful();

    // Should not create any admin users
    $this->assertDatabaseMissing('users', [
        'role' => UserRole::Admin->value,
    ]);
});

test('admin seeder sets email_verified_at', function () {
    config([
        'admin.user.email' => 'verified@test.com',
        'admin.user.password' => 'password123',
        'admin.user.name' => 'Verified Admin',
    ]);

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->assertSuccessful();

    $user = User::where('email', 'verified@test.com')->first();
    expect($user)->not->toBeNull();
    expect($user->email_verified_at)->not->toBeNull();
});

test('admin seeder does not rehash password if unchanged', function () {
    // Create user with known password
    $user = User::factory()->create([
        'email' => 'test@test.com',
        'password' => Hash::make('password123'),
        'role' => UserRole::User,
    ]);

    $originalPasswordHash = $user->password;

    config([
        'admin.user.email' => 'test@test.com',
        'admin.user.password' => 'password123',
        'admin.user.name' => 'Test User',
    ]);

    $this->artisan('db:seed', ['--class' => AdminUserSeeder::class])
        ->assertSuccessful();

    $user->refresh();

    // Password hash should remain the same since password hasn't changed
    expect($user->password)->toBe($originalPasswordHash);
    expect($user->role)->toBe(UserRole::Admin);
});
