<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;
use App\Services\TripService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

beforeEach(function () {
    $this->tripService = new TripService;
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('ensureDefaultTrip creates a default trip if none exists', function () {
    expect($this->user->trips()->count())->toBe(0);

    $trip = $this->tripService->ensureDefaultTrip($this->user);

    expect($trip)->toBeInstanceOf(Trip::class);
    expect($trip->name)->toBe('Default');
    expect($this->user->trips()->count())->toBe(1);
});

test('ensureDefaultTrip returns existing trip if one exists', function () {
    $existingTrip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Existing Trip',
    ]);

    $trip = $this->tripService->ensureDefaultTrip($this->user);

    expect($trip->id)->toBe($existingTrip->id);
    expect($trip->name)->toBe('Existing Trip');
    expect($this->user->trips()->count())->toBe(1);
});

test('getActiveTrip returns specified trip if it exists', function () {
    $trip1 = Trip::factory()->create(['user_id' => $this->user->id, 'name' => 'Trip 1']);
    $trip2 = Trip::factory()->create(['user_id' => $this->user->id, 'name' => 'Trip 2']);

    $activeTrip = $this->tripService->getActiveTrip($this->user, $trip2->id);

    expect($activeTrip->id)->toBe($trip2->id);
    expect($activeTrip->name)->toBe('Trip 2');
});

test('getActiveTrip returns default trip if specified trip does not exist', function () {
    Trip::factory()->create(['user_id' => $this->user->id, 'name' => 'Existing Trip']);

    $activeTrip = $this->tripService->getActiveTrip($this->user, 999);

    expect($activeTrip->name)->toBe('Existing Trip');
});

test('getActiveTrip creates default trip if no trips exist and no trip specified', function () {
    expect($this->user->trips()->count())->toBe(0);

    $activeTrip = $this->tripService->getActiveTrip($this->user);

    expect($activeTrip->name)->toBe('Default');
    expect($this->user->trips()->count())->toBe(1);
});

test('findTripForUser returns trip when it belongs to user', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $result = $this->tripService->findTripForUser($this->user, $trip->id);

    expect($result->id)->toBe($trip->id);
    expect($result->user_id)->toBe($this->user->id);
});

test('findTripForUser throws ModelNotFoundException when trip does not exist', function () {
    $this->tripService->findTripForUser($this->user, 999);
})->throws(ModelNotFoundException::class);

test('findTripForUser throws AuthorizationException when trip belongs to another user', function () {
    $otherUser = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $otherUser->id]);

    $this->tripService->findTripForUser($this->user, $trip->id);
})->throws(AuthorizationException::class, 'This action is unauthorized.');

test('assertMarkersBelongToTrip returns true when all markers belong to trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $marker1 = Marker::factory()->create(['trip_id' => $trip->id]);
    $marker2 = Marker::factory()->create(['trip_id' => $trip->id]);

    $result = $this->tripService->assertMarkersBelongToTrip($trip, $marker1, $marker2);

    expect($result)->toBeTrue();
});

test('assertMarkersBelongToTrip returns false when marker does not belong to trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $marker1 = Marker::factory()->create(['trip_id' => $trip->id]);
    $marker2 = Marker::factory()->create(['trip_id' => $otherTrip->id]);

    $result = $this->tripService->assertMarkersBelongToTrip($trip, $marker1, $marker2);

    expect($result)->toBeFalse();
});

test('assertMarkersBelongToTrip returns false when any marker does not belong to trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $marker = Marker::factory()->create(['trip_id' => $otherTrip->id]);

    $result = $this->tripService->assertMarkersBelongToTrip($trip, $marker);

    expect($result)->toBeFalse();
});

test('assertMarkersBelongToTrip returns true with single marker', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $marker = Marker::factory()->create(['trip_id' => $trip->id]);

    $result = $this->tripService->assertMarkersBelongToTrip($trip, $marker);

    expect($result)->toBeTrue();
});
