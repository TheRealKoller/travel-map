<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

test('marker can be created with village type', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Rothenburg ob der Tauber',
        'type' => 'village',
        'notes' => 'Historic medieval village',
        'latitude' => 49.3768,
        'longitude' => 10.1806,
        'trip_id' => $trip->id,
    ];

    $response = $this->actingAs($user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Rothenburg ob der Tauber',
        'type' => 'village',
    ]);
});

test('marker factory can generate village markers', function () {
    $marker = Marker::factory()->create(['type' => 'village']);

    expect($marker->type)->toBe('village');
});

test('village marker can be updated', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $marker = Marker::factory()->create([
        'user_id' => $user->id,
        'trip_id' => $trip->id,
        'name' => 'Location',
        'type' => 'point of interest',
    ]);

    $response = $this->actingAs($user)->putJson("/markers/{$marker->id}", [
        'type' => 'village',
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'type' => 'village',
    ]);
});
