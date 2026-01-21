<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('calculates tour duration from markers estimated_hours', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    // Create markers with estimated hours
    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 2.5,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 1.75,
    ]);
    $marker3 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 0.5,
    ]);

    // Attach markers to tour
    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);
    $tour->markers()->attach($marker3->id, ['position' => 2]);

    $tour->load('markers', 'routes');

    expect($tour->estimated_duration_hours)->toBe(4.75); // 2.5 + 1.75 + 0.5
});

it('calculates tour duration from routes durations', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $marker1 = Marker::factory()->create(['trip_id' => $trip->id]);
    $marker2 = Marker::factory()->create(['trip_id' => $trip->id]);
    $marker3 = Marker::factory()->create(['trip_id' => $trip->id]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);
    $tour->markers()->attach($marker3->id, ['position' => 2]);

    // Create routes with durations in seconds
    Route::factory()->create([
        'trip_id' => $trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $marker1->id,
        'end_marker_id' => $marker2->id,
        'duration' => 3600, // 1 hour in seconds
    ]);
    Route::factory()->create([
        'trip_id' => $trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $marker2->id,
        'end_marker_id' => $marker3->id,
        'duration' => 7200, // 2 hours in seconds
    ]);

    $tour->load('markers', 'routes');

    expect($tour->estimated_duration_hours)->toBe(3.0); // 1 + 2 hours
});

it('calculates tour duration from both markers and routes', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    // Create markers with estimated hours
    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 2.0,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 1.5,
    ]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);

    // Create route with duration
    Route::factory()->create([
        'trip_id' => $trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $marker1->id,
        'end_marker_id' => $marker2->id,
        'duration' => 5400, // 1.5 hours in seconds
    ]);

    $tour->load('markers', 'routes');

    expect($tour->estimated_duration_hours)->toBe(5.0); // 2.0 + 1.5 + 1.5
});

it('returns 0 for tour with no markers or routes', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $tour->load('markers', 'routes');

    expect($tour->estimated_duration_hours)->toBe(0.0);
});

it('handles markers with null estimated_hours', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => null,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 2.5,
    ]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);

    $tour->load('markers', 'routes');

    expect($tour->estimated_duration_hours)->toBe(2.5);
});

it('rounds duration to 2 decimal places', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 1.333,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 2.666,
    ]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);

    $tour->load('markers', 'routes');

    expect($tour->estimated_duration_hours)->toBe(4.0); // Rounded from 3.999
});

it('includes estimated_duration_hours in API response', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 2.0,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 1.5,
    ]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);

    Route::factory()->create([
        'trip_id' => $trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $marker1->id,
        'end_marker_id' => $marker2->id,
        'duration' => 3600, // 1 hour
    ]);

    $response = $this->getJson("/tours?trip_id={$trip->id}");

    $response->assertStatus(200);
    $response->assertJsonPath('0.estimated_duration_hours', 4.5); // 2.0 + 1.5 + 1.0
});

it('includes estimated_duration_hours when viewing a single tour', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'estimated_hours' => 3.0,
    ]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);

    $response = $this->getJson("/tours/{$tour->id}");

    $response->assertStatus(200);
    $response->assertJsonPath('estimated_duration_hours', 3);
});
