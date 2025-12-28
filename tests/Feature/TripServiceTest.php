<?php

use App\Models\Trip;
use App\Models\User;
use App\Services\TripService;

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

