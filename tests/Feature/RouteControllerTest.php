<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Http;

uses()->group('routes');

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->startMarker = Marker::factory()->create(['trip_id' => $this->trip->id]);
    $this->endMarker = Marker::factory()->create(['trip_id' => $this->trip->id]);
});

it('can list routes for a trip', function () {
    Route::factory()->count(3)->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
    ]);

    $response = $this->getJson("/routes?trip_id={$this->trip->id}");

    $response->assertOk()
        ->assertJsonCount(3)
        ->assertJsonStructure([
            '*' => [
                'id',
                'trip_id',
                'start_marker',
                'end_marker',
                'transport_mode',
                'distance',
                'duration',
                'geometry',
            ],
        ]);
});

it('requires trip_id when listing routes', function () {
    $response = $this->getJson('/routes');

    $response->assertStatus(400)
        ->assertJson(['error' => 'trip_id is required']);
});

it('can create a route between two markers', function () {
    // Mock OSRM API response
    Http::fake([
        'router.project-osrm.org/*' => Http::response([
            'routes' => [
                [
                    'distance' => 50000, // 50km
                    'duration' => 3600, // 1 hour
                    'geometry' => [
                        'coordinates' => [
                            [$this->startMarker->lng, $this->startMarker->lat],
                            [$this->endMarker->lng, $this->endMarker->lat],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'id',
            'trip_id',
            'start_marker',
            'end_marker',
            'transport_mode',
            'distance',
            'duration',
            'geometry',
        ]);

    $this->assertDatabaseHas('routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
        'distance' => 50000,
        'duration' => 3600,
    ]);
});

it('validates that start and end markers are different', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->startMarker->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertStatus(422);
});

it('validates that markers belong to the trip', function () {
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $otherMarker = Marker::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $otherMarker->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertStatus(422)
        ->assertJson(['error' => 'Markers must belong to the same trip']);
});

it('can delete a route', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
    ]);

    $response = $this->deleteJson("/routes/{$route->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('routes', ['id' => $route->id]);
});

it('cannot access another users routes', function () {
    $otherUser = User::factory()->create();
    $otherTrip = Trip::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->getJson("/routes?trip_id={$otherTrip->id}");

    $response->assertForbidden();
});

it('requires valid transport mode', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'invalid-mode',
    ]);

    $response->assertStatus(422);
});
