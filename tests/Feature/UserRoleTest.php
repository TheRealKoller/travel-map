<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user is created with default user role', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe(UserRole::User);
});

test('user can be created with admin role', function () {
    $user = User::factory()->admin()->create();

    expect($user->role)->toBe(UserRole::Admin);
});

test('isAdmin returns true for admin users', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    expect($admin->isAdmin())->toBeTrue();
    expect($user->isAdmin())->toBeFalse();
});

test('isUser returns true for regular users', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    expect($admin->isUser())->toBeFalse();
    expect($user->isUser())->toBeTrue();
});

test('role field is fillable', function () {
    $user = User::factory()->create();

    $user->fill(['role' => UserRole::Admin]);
    $user->save();

    expect($user->role)->toBe(UserRole::Admin);
});
