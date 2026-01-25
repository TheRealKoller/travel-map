<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('BusinessLogicException returns correct error structure for simple errors', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $otherTrip->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'Marker does not belong to this tour\'s trip',
        ])
        ->assertJsonMissing(['errors']);
});

test('BusinessLogicException returns correct status code for 400 errors', function () {
    $response = $this->actingAs($this->user)->getJson('/tours');

    $response->assertStatus(400)
        ->assertJson([
            'success' => false,
            'error' => 'trip_id is required',
        ]);
});

test('BusinessLogicException returns correct status code for 404 errors', function () {
    $response = $this->actingAs($this->user)->postJson("/trips/{$this->trip->id}/fetch-image");

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'error' => 'No image found for this trip',
        ]);
});

test('Laravel ValidationException returns consistent error structure', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/enrich', [
        'name' => '',
        'latitude' => 'invalid',
        'longitude' => 200,
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'Validation failed',
        ])
        ->assertJsonStructure([
            'success',
            'error',
            'errors',
        ]);
});

test('tour must have at least 2 markers to sort throws BusinessLogicException', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $tour->markers()->attach($marker->id, ['position' => 0]);

    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers/sort");

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'Tour must have at least 2 markers to sort',
        ]);
});

test('tour with too many markers throws BusinessLogicException', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    // Create 26 markers (exceeding the limit of 25)
    for ($i = 0; $i < 26; $i++) {
        $marker = Marker::factory()->create([
            'trip_id' => $this->trip->id,
            'user_id' => $this->user->id,
        ]);
        $tour->markers()->attach($marker->id, ['position' => $i]);
    }

    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers/sort");

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'error' => 'Tour has too many markers. Maximum is 25 markers for automatic sorting.',
        ]);
});
