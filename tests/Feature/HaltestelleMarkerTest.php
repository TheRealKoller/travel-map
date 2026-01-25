<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

test('marker can be created with haltestelle type', function () {
    $user = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Hauptbahnhof',
        'type' => 'haltestelle',
        'notes' => 'Main train station',
        'latitude' => 52.5200,
        'longitude' => 13.4050,
        'trip_id' => $trip->id,
    ];

    $response = $this->actingAs($user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Hauptbahnhof',
        'type' => 'haltestelle',
    ]);
});

test('marker factory can generate haltestelle markers', function () {
    $marker = Marker::factory()->create(['type' => 'haltestelle']);

    expect($marker->type)->toBe('haltestelle');
});
