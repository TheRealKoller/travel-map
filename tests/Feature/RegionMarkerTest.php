<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

test('marker can be created with region type', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Bavaria',
        'type' => 'region',
        'notes' => 'Southern region of Germany',
        'latitude' => 48.7904,
        'longitude' => 11.4979,
        'trip_id' => $trip->id,
    ];

    $response = $this->actingAs($user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Bavaria',
        'type' => 'region',
    ]);
});

test('marker factory can generate region markers', function () {
    $marker = Marker::factory()->create(['type' => 'region']);

    expect($marker->type)->toBe('region');
});

test('region marker can be updated', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $marker = Marker::factory()->create([
        'user_id' => $user->id,
        'trip_id' => $trip->id,
        'name' => 'Location',
        'type' => 'point of interest',
    ]);

    $response = $this->actingAs($user)->putJson("/markers/{$marker->id}", [
        'type' => 'region',
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'type' => 'region',
    ]);
});
