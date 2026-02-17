<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user is created with default user role', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe('user');
});

test('user can be created with admin role', function () {
    $user = User::factory()->create(['role' => 'admin']);

    expect($user->role)->toBe('admin');
});

test('isAdmin returns true for admin users', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'user']);

    expect($admin->isAdmin())->toBeTrue();
    expect($user->isAdmin())->toBeFalse();
});

test('isUser returns true for regular users', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'user']);

    expect($admin->isUser())->toBeFalse();
    expect($user->isUser())->toBeTrue();
});

test('role field is fillable', function () {
    $user = User::factory()->create();

    $user->fill(['role' => 'admin']);
    $user->save();

    expect($user->role)->toBe('admin');
});
