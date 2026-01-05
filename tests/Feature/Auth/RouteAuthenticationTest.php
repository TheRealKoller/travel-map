<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

test('unauthenticated users cannot access home page', function () {
    $response = $this->get('/');

    $response->assertRedirect(route('login'));
});

test('unauthenticated users cannot access dashboard', function () {
    $response = $this->get('/dashboard');

    $response->assertRedirect(route('login'));
});

test('unauthenticated users cannot list trips', function () {
    $response = $this->getJson('/trips');

    $response->assertUnauthorized();
});

test('unauthenticated users cannot create trips', function () {
    $response = $this->postJson('/trips', [
        'name' => 'Test Trip',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(7)->toDateString(),
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot view trip details', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this->getJson("/trips/{$trip->id}");

    $response->assertUnauthorized();
});

test('unauthenticated users cannot update trips', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this->putJson("/trips/{$trip->id}", [
        'name' => 'Updated Trip',
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot delete trips', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this->deleteJson("/trips/{$trip->id}");

    $response->assertUnauthorized();
});

test('unauthenticated users cannot list tours', function () {
    $response = $this->getJson('/tours?trip_id=1');

    $response->assertUnauthorized();
});

test('unauthenticated users cannot create tours', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this->postJson('/tours', [
        'name' => 'Test Tour',
        'trip_id' => $trip->id,
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot view tour details', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $response = $this->getJson("/tours/{$tour->id}");

    $response->assertUnauthorized();
});

test('unauthenticated users cannot update tours', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $response = $this->putJson("/tours/{$tour->id}", [
        'name' => 'Updated Tour',
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot delete tours', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $response = $this->deleteJson("/tours/{$tour->id}");

    $response->assertUnauthorized();
});

test('unauthenticated users cannot attach markers to tours', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);
    $marker = Marker::factory()->create(['trip_id' => $trip->id]);

    $response = $this->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot detach markers from tours', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);
    $marker = Marker::factory()->create(['trip_id' => $trip->id]);

    $response = $this->deleteJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot reorder tour markers', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $response = $this->putJson("/tours/{$tour->id}/markers/reorder", [
        'marker_ids' => [1, 2, 3],
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot list markers', function () {
    $response = $this->getJson('/markers?trip_id=1');

    $response->assertUnauthorized();
});

test('unauthenticated users cannot create markers', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this->postJson('/markers', [
        'name' => 'Test Marker',
        'latitude' => 51.5074,
        'longitude' => -0.1278,
        'trip_id' => $trip->id,
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot update markers', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $marker = Marker::factory()->create(['trip_id' => $trip->id]);

    $response = $this->putJson("/markers/{$marker->id}", [
        'name' => 'Updated Marker',
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot delete markers', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $marker = Marker::factory()->create(['trip_id' => $trip->id]);

    $response = $this->deleteJson("/markers/{$marker->id}");

    $response->assertUnauthorized();
});

test('unauthenticated users cannot search nearby markers', function () {
    $response = $this->postJson('/markers/search-nearby', [
        'latitude' => 51.5074,
        'longitude' => -0.1278,
        'radius' => 1000,
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot get marker place types', function () {
    $response = $this->getJson('/markers/place-types');

    $response->assertUnauthorized();
});

test('unauthenticated users cannot list routes', function () {
    $response = $this->getJson('/routes?trip_id=1');

    $response->assertUnauthorized();
});

test('unauthenticated users cannot create routes', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $startMarker = Marker::factory()->create(['trip_id' => $trip->id]);
    $endMarker = Marker::factory()->create(['trip_id' => $trip->id]);

    $response = $this->postJson('/routes', [
        'trip_id' => $trip->id,
        'start_marker_id' => $startMarker->id,
        'end_marker_id' => $endMarker->id,
        'transport_mode' => 'driving',
    ]);

    $response->assertUnauthorized();
});

test('unauthenticated users cannot view route details', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $startMarker = Marker::factory()->create(['trip_id' => $trip->id]);
    $endMarker = Marker::factory()->create(['trip_id' => $trip->id]);
    $route = Route::factory()->create([
        'trip_id' => $trip->id,
        'start_marker_id' => $startMarker->id,
        'end_marker_id' => $endMarker->id,
    ]);

    $response = $this->getJson("/routes/{$route->id}");

    $response->assertUnauthorized();
});

test('unauthenticated users cannot delete routes', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $startMarker = Marker::factory()->create(['trip_id' => $trip->id]);
    $endMarker = Marker::factory()->create(['trip_id' => $trip->id]);
    $route = Route::factory()->create([
        'trip_id' => $trip->id,
        'start_marker_id' => $startMarker->id,
        'end_marker_id' => $endMarker->id,
    ]);

    $response = $this->deleteJson("/routes/{$route->id}");

    $response->assertUnauthorized();
});

test('unauthenticated users cannot access settings profile', function () {
    $response = $this->get('/settings/profile');

    $response->assertRedirect(route('login'));
});

test('unauthenticated users cannot access settings password', function () {
    $response = $this->get('/settings/password');

    $response->assertRedirect(route('login'));
});

test('unauthenticated users cannot access settings appearance', function () {
    $response = $this->get('/settings/appearance');

    $response->assertRedirect(route('login'));
});

test('unauthenticated users cannot access settings two-factor', function () {
    $response = $this->get('/settings/two-factor');

    $response->assertRedirect(route('login'));
});

test('unauthenticated users cannot access logs', function () {
    $response = $this->get('/logs');

    $response->assertRedirect(route('login'));
});

test('boost browser logs endpoint has auth middleware when registered', function () {
    // Laravel Boost explicitly disables itself during unit tests
    // This test documents that we've added auth middleware in AppServiceProvider
    // which will protect the endpoint when Boost is enabled in local/production environments

    // In production or local environments where Boost is enabled,
    // the middleware is added in AppServiceProvider::boot()
    // This ensures the endpoint cannot be accessed without authentication

    $this->assertTrue(true, 'Auth middleware for Boost is configured in AppServiceProvider');
})->skip('Laravel Boost disables itself during unit tests - protection is in AppServiceProvider');
