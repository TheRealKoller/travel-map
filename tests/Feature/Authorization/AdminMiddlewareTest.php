<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

test('admin middleware allows admin users', function () {
    $admin = User::factory()->admin()->create();

    // Create a test route that uses the admin middleware
    Route::get('/test-admin', fn () => response()->json(['success' => true]))->middleware('admin');

    $response = $this->actingAs($admin)->getJson('/test-admin');

    $response->assertSuccessful()
        ->assertJson(['success' => true]);
});

test('admin middleware blocks regular users with 403', function () {
    $user = User::factory()->create();

    Route::get('/test-admin', fn () => response()->json(['success' => true]))->middleware('admin');

    $response = $this->actingAs($user)->getJson('/test-admin');

    $response->assertForbidden();
});

test('admin middleware blocks guests with 403', function () {
    Route::get('/test-admin', fn () => response()->json(['success' => true]))->middleware('admin');

    $response = $this->getJson('/test-admin');

    $response->assertForbidden();
});

test('admin middleware provides appropriate error message for non-admin', function () {
    $user = User::factory()->create();

    Route::get('/test-admin', fn () => response()->json(['success' => true]))->middleware('admin');

    $response = $this->actingAs($user)->getJson('/test-admin');

    $response->assertForbidden()
        ->assertJson(['message' => 'Access denied. Admin privileges required.']);
});
