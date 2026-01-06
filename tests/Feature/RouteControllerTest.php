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
                'warning',
            ],
        ]);
});

it('requires trip_id when listing routes', function () {
    $response = $this->getJson('/routes');

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['trip_id']);
});

it('can create a route between two markers', function () {
    // Set Mapbox token for test
    config(['services.mapbox.access_token' => 'test-token']);

    // Mock Mapbox API response
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [
                [
                    'distance' => 50000, // 50km
                    'duration' => 3600, // 1 hour
                    'geometry' => [
                        'coordinates' => [
                            [$this->startMarker->longitude, $this->startMarker->latitude],
                            [$this->endMarker->longitude, $this->endMarker->latitude],
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
            'warning',
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

it('can create route with public transport via Mapbox', function () {
    // Mock Mapbox API response
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [
                [
                    'distance' => 25000, // 25km
                    'duration' => 1800, // 30 minutes
                    'geometry' => [
                        'coordinates' => [
                            [$this->startMarker->longitude, $this->startMarker->latitude],
                            [$this->endMarker->longitude, $this->endMarker->latitude],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    // Set Mapbox token for test
    config(['services.mapbox.access_token' => 'test-token']);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'public-transport',
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
            'warning',
        ]);

    $this->assertDatabaseHas('routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'public-transport',
        'distance' => 25000,
        'duration' => 1800,
    ]);
});

it('throws exception when Mapbox token is not configured', function () {
    // Clear Mapbox token
    config(['services.mapbox.access_token' => null]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertStatus(503)
        ->assertJson(['error' => 'Mapbox access token not configured. Please add MAPBOX_ACCESS_TOKEN to your .env file.']);
});

it('generates warning for very long walking routes', function () {
    // Set Mapbox token for test
    config(['services.mapbox.access_token' => 'test-token']);

    // Mock Mapbox API response for a very long walking route (814km in 10.5 hours = unrealistic)
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [
                [
                    'distance' => 814530, // 814.53km
                    'duration' => 37860, // 10.5 hours (unrealistic)
                    'geometry' => [
                        'coordinates' => [
                            [$this->startMarker->longitude, $this->startMarker->latitude],
                            [$this->endMarker->longitude, $this->endMarker->latitude],
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
        'transport_mode' => 'foot-walking',
    ]);

    $response->assertCreated();

    // Verify the route was created with a warning
    $route = Route::latest()->first();
    expect($route->warning)->not->toBeNull();
    expect($route->warning)->toContain('very long');

    // Check that the warning is in the response
    $data = $response->json();
    expect($data['warning'])->not->toBeNull();
    expect($data['warning'])->toContain('very long');
});

it('returns 404 when no route is found between markers', function () {
    // Set Mapbox token for test
    config(['services.mapbox.access_token' => 'test-token']);

    // Mock Mapbox API response with no routes
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [],
        ], 200),
    ]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertStatus(404)
        ->assertJson(['error' => 'No route found between the markers']);
});

it('returns 503 when Mapbox API fails', function () {
    // Set Mapbox token for test
    config(['services.mapbox.access_token' => 'test-token']);

    // Mock Mapbox API failure
    Http::fake([
        'api.mapbox.com/*' => Http::response('Internal Server Error', 500),
    ]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertStatus(503)
        ->assertJsonStructure(['error']);
});

it('returns 404 when Mapbox finds no route', function () {
    // Set Mapbox token for test
    config(['services.mapbox.access_token' => 'test-token']);

    // Mock Mapbox API response with no routes
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [],
        ], 200),
    ]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'public-transport',
    ]);

    $response->assertStatus(404)
        ->assertJson(['error' => 'No route found between the markers']);
});
