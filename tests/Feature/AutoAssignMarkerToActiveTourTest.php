<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
});

test('newly created marker is automatically added to active tour when tour_id is provided', function () {
    $markerData = [
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'name' => 'Test Marker',
        'type' => 'point_of_interest',
        'notes' => 'Test notes',
        'url' => 'https://example.com',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
        'tour_id' => $this->tour->id,
        'is_unesco' => false,
        'ai_enriched' => false,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    // Verify marker is in the database
    $this->assertDatabaseHas('markers', [
        'id' => $markerData['id'],
        'name' => 'Test Marker',
        'trip_id' => $this->trip->id,
    ]);

    // Verify marker is attached to the tour
    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $markerData['id'],
        'tour_id' => $this->tour->id,
    ]);

    // Verify the marker has position 0 (first in tour)
    $pivotRecord = \Illuminate\Support\Facades\DB::table('marker_tour')
        ->where('marker_id', $markerData['id'])
        ->where('tour_id', $this->tour->id)
        ->first();

    expect($pivotRecord)->not->toBeNull();
    expect($pivotRecord->position)->toBe(0);
});

test('newly created marker gets correct position when added to tour with existing markers', function () {
    // Create two existing markers in the tour
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $this->tour->markers()->attach($marker1->id, ['position' => 0]);
    $this->tour->markers()->attach($marker2->id, ['position' => 1]);

    // Create a new marker with tour_id
    $markerData = [
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'name' => 'New Marker',
        'type' => 'restaurant',
        'notes' => '',
        'url' => '',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
        'tour_id' => $this->tour->id,
        'is_unesco' => false,
        'ai_enriched' => false,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    // Verify the new marker has position 2 (after the existing markers)
    $pivotRecord = \Illuminate\Support\Facades\DB::table('marker_tour')
        ->where('marker_id', $markerData['id'])
        ->where('tour_id', $this->tour->id)
        ->first();

    expect($pivotRecord)->not->toBeNull();
    expect($pivotRecord->position)->toBe(2);
});

test('marker created without tour_id is not added to any tour', function () {
    $markerData = [
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'name' => 'Test Marker',
        'type' => 'point_of_interest',
        'notes' => '',
        'url' => '',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
        'is_unesco' => false,
        'ai_enriched' => false,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    // Verify marker is in the database
    $this->assertDatabaseHas('markers', [
        'id' => $markerData['id'],
        'name' => 'Test Marker',
    ]);

    // Verify marker is NOT attached to any tour
    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $markerData['id'],
    ]);
});

test('marker is not added to tour if tour belongs to different trip', function () {
    // Create a different trip and tour
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    // Try to create a marker in one trip but assign it to a tour from another trip
    $markerData = [
        'id' => (string) \Illuminate\Support\Str::uuid(),
        'name' => 'Test Marker',
        'type' => 'point_of_interest',
        'notes' => '',
        'url' => '',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
        'tour_id' => $otherTour->id, // Tour belongs to a different trip
        'is_unesco' => false,
        'ai_enriched' => false,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    // Verify marker is in the database
    $this->assertDatabaseHas('markers', [
        'id' => $markerData['id'],
        'trip_id' => $this->trip->id,
    ]);

    // Verify marker is NOT attached to the other tour (because it belongs to a different trip)
    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $markerData['id'],
        'tour_id' => $otherTour->id,
    ]);
});
