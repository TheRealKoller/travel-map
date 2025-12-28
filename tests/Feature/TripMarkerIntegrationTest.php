<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('markers can be associated with a trip', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'notes' => 'Test notes',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
        'trip_id' => $this->trip->id,
    ]);
});

test('markers endpoint filters by trip_id', function () {
    $trip1 = Trip::factory()->create(['user_id' => $this->user->id, 'name' => 'Trip 1']);
    $trip2 = Trip::factory()->create(['user_id' => $this->user->id, 'name' => 'Trip 2']);

    // Create markers for trip1
    Marker::factory()->count(3)->create([
        'user_id' => $this->user->id,
        'trip_id' => $trip1->id,
    ]);

    // Create markers for trip2
    Marker::factory()->count(2)->create([
        'user_id' => $this->user->id,
        'trip_id' => $trip2->id,
    ]);

    $response = $this->actingAs($this->user)->getJson("/markers?trip_id={$trip1->id}");

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

test('markers are deleted when trip is deleted', function () {
    $marker1 = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
    ]);
    $marker2 = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
    ]);

    $this->actingAs($this->user)->deleteJson("/trips/{$this->trip->id}");

    $this->assertDatabaseMissing('markers', ['id' => $marker1->id]);
    $this->assertDatabaseMissing('markers', ['id' => $marker2->id]);
});

test('default trip is created when no trip_id is provided and user has no trips', function () {
    // Create a new user with no trips
    $newUser = User::factory()->withoutTwoFactor()->create();

    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'notes' => 'Test notes',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
    ];

    $response = $this->actingAs($newUser)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    // Should create a default trip
    $this->assertDatabaseHas('trips', [
        'user_id' => $newUser->id,
        'name' => 'Default',
    ]);

    $defaultTrip = $newUser->trips()->where('name', 'Default')->first();

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
        'trip_id' => $defaultTrip->id,
    ]);
});
