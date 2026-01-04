<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

test('marker can be created with natural attraction type', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Yellowstone National Park',
        'type' => 'natural attraction',
        'notes' => 'Famous national park with geysers and wildlife',
        'latitude' => 44.4280,
        'longitude' => -110.5885,
        'trip_id' => $trip->id,
    ];

    $response = $this->actingAs($user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Yellowstone National Park',
        'type' => 'natural attraction',
    ]);
});

test('marker factory can generate natural attraction markers', function () {
    $marker = Marker::factory()->create(['type' => 'natural attraction']);

    expect($marker->type)->toBe('natural attraction');
});

test('natural attraction marker can be updated', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $marker = Marker::factory()->create([
        'user_id' => $user->id,
        'trip_id' => $trip->id,
        'name' => 'Waterfall',
        'type' => 'point of interest',
    ]);

    $response = $this->actingAs($user)->putJson("/markers/{$marker->id}", [
        'type' => 'natural attraction',
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'type' => 'natural attraction',
    ]);
});
