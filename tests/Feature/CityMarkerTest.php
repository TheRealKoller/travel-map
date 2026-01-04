<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

test('marker can be created with city type', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Berlin',
        'type' => 'city',
        'notes' => 'Capital city of Germany',
        'latitude' => 52.5200,
        'longitude' => 13.4050,
        'trip_id' => $trip->id,
    ];

    $response = $this->actingAs($user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Berlin',
        'type' => 'city',
    ]);
});

test('marker factory can generate city markers', function () {
    $marker = Marker::factory()->create(['type' => 'city']);

    expect($marker->type)->toBe('city');
});

test('city marker can be updated', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $marker = Marker::factory()->create([
        'user_id' => $user->id,
        'trip_id' => $trip->id,
        'name' => 'Location',
        'type' => 'point of interest',
    ]);

    $response = $this->actingAs($user)->putJson("/markers/{$marker->id}", [
        'type' => 'city',
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'type' => 'city',
    ]);
});
