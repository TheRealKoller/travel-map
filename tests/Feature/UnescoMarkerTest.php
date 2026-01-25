<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('marker creation allows unesco flag to be set', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Taj Mahal',
        'type' => 'point of interest',
        'notes' => 'UNESCO World Heritage Site',
        'latitude' => 27.1751,
        'longitude' => 78.0421,
        'trip_id' => $this->trip->id,
        'is_unesco' => true,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Taj Mahal',
        'is_unesco' => true,
    ]);
});

test('marker creation defaults unesco flag to false', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Random Location',
        'type' => 'point of interest',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Random Location',
        'is_unesco' => false,
    ]);
});

test('marker update can change unesco flag', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Eiffel Tower',
        'is_unesco' => false,
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'is_unesco' => true,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'is_unesco' => true,
    ]);
});

test('can retrieve markers filtered by unesco status', function () {
    // Create UNESCO markers
    Marker::factory()->count(3)->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'is_unesco' => true,
    ]);

    // Create non-UNESCO markers
    Marker::factory()->count(2)->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'is_unesco' => false,
    ]);

    $allMarkers = Marker::where('trip_id', $this->trip->id)->get();
    $unescoMarkers = Marker::where('trip_id', $this->trip->id)
        ->where('is_unesco', true)
        ->get();
    $nonUnescoMarkers = Marker::where('trip_id', $this->trip->id)
        ->where('is_unesco', false)
        ->get();

    expect($allMarkers)->toHaveCount(5);
    expect($unescoMarkers)->toHaveCount(3);
    expect($nonUnescoMarkers)->toHaveCount(2);

    // Verify all UNESCO markers have the flag set
    foreach ($unescoMarkers as $marker) {
        expect($marker->is_unesco)->toBeTrue();
    }

    // Verify all non-UNESCO markers have the flag unset
    foreach ($nonUnescoMarkers as $marker) {
        expect($marker->is_unesco)->toBeFalse();
    }
});
