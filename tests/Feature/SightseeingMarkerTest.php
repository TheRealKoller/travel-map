<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

test('marker can be created with sightseeing type', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Eiffel Tower',
        'type' => 'sightseeing',
        'notes' => 'Famous sightseeing location',
        'latitude' => 48.8584,
        'longitude' => 2.2945,
        'trip_id' => $trip->id,
    ];

    $response = $this->actingAs($user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Eiffel Tower',
        'type' => 'sightseeing',
    ]);
});

test('marker factory can generate sightseeing markers', function () {
    $marker = Marker::factory()->create(['type' => 'sightseeing']);

    expect($marker->type)->toBe('sightseeing');
});
