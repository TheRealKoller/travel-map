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
    $this->assertSoftDeleted('routes', ['id' => $route->id]);
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

it('can create route with public transport via Google Maps', function () {
    // Mock Google Routes API v2 response
    Http::fake([
        'routes.googleapis.com/*' => Http::response([
            'routes' => [
                [
                    'distanceMeters' => 25000,
                    'duration' => '1800s',
                    'polyline' => [
                        'encodedPolyline' => 'u{~vFvyys@',
                    ],
                    'legs' => [
                        [
                            'localizedValues' => [
                                'departure' => ['time' => ['text' => '14:00']],
                                'arrival' => ['time' => ['text' => '14:30']],
                            ],
                            'steps' => [
                                [
                                    'travelMode' => 'WALK',
                                    'distanceMeters' => 500,
                                    'staticDuration' => '360s',
                                ],
                                [
                                    'travelMode' => 'TRANSIT',
                                    'distanceMeters' => 24000,
                                    'staticDuration' => '1200s',
                                    'transitDetails' => [
                                        'stopDetails' => [
                                            'departureStop' => [
                                                'name' => 'Main Station',
                                                'location' => ['latitude' => 52.52, 'longitude' => 13.405],
                                            ],
                                            'arrivalStop' => [
                                                'name' => 'Central Square',
                                                'location' => ['latitude' => 52.53, 'longitude' => 13.42],
                                            ],
                                            'departureTime' => '2026-01-12T14:06:00Z',
                                            'arrivalTime' => '2026-01-12T14:26:00Z',
                                        ],
                                        'transitLine' => [
                                            'name' => 'Bus Line 100',
                                            'nameShort' => '100',
                                            'color' => '#FF0000',
                                            'vehicle' => [
                                                'name' => ['text' => 'BUS'],
                                            ],
                                        ],
                                        'stopCount' => 12,
                                        'headsign' => 'City Center',
                                    ],
                                ],
                                [
                                    'travelMode' => 'WALK',
                                    'distanceMeters' => 500,
                                    'staticDuration' => '240s',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    // Set Google Maps API key for test
    config(['services.google_maps.api_key' => 'test-google-key']);

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
            'transit_details',
            'warning',
        ]);

    expect($response->json('transit_details'))->toBeArray()
        ->and($response->json('transit_details.steps'))->toHaveCount(3)
        ->and($response->json('transit_details.steps.1.transit'))->toHaveKey('departure_stop')
        ->and($response->json('transit_details.steps.1.transit.line.short_name'))->toBe('100');

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

it('returns 404 when Google Maps finds no transit route', function () {
    // Set Google Maps API key for test
    config(['services.google_maps.api_key' => 'test-google-key']);

    // Mock Google Routes API v2 response with no routes
    Http::fake([
        'routes.googleapis.com/*' => Http::response([
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
        ->assertJson(['error' => 'No public transport route found between the markers']);
});

// --- updateAlternative (PATCH /routes/{route}/alternative) ---

it('can adopt an alternative public transport route', function () {
    $alternatives = [
        [
            'distance' => 30000,
            'duration' => 2400,
            'geometry' => [[13.4, 52.5], [13.45, 52.52], [13.5, 52.55]],
            'transit_details' => ['steps' => []],
        ],
        [
            'distance' => 20000,
            'duration' => 1800,
            'geometry' => [[13.4, 52.5], [13.47, 52.53]],
            'transit_details' => ['steps' => []],
        ],
    ];

    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'public-transport',
        'alternatives' => $alternatives,
    ]);

    $response = $this->patchJson("/routes/{$route->id}/alternative", [
        'alternative_index' => 1,
    ]);

    $response->assertOk()
        ->assertJsonStructure(['id', 'distance', 'duration', 'geometry', 'transit_details'])
        ->assertJsonPath('distance.meters', 20000)
        ->assertJsonPath('duration.seconds', 1800);

    $this->assertDatabaseHas('routes', [
        'id' => $route->id,
        'distance' => 20000,
        'duration' => 1800,
    ]);

    // alternatives should be cleared after adoption
    expect(Route::find($route->id)->alternatives)->toBeNull();
});

it('returns 422 when adopting alternative for non-public-transport route', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
        'alternatives' => null,
    ]);

    $response = $this->patchJson("/routes/{$route->id}/alternative", [
        'alternative_index' => 0,
    ]);

    $response->assertStatus(422)
        ->assertJson(['error' => 'Alternative selection is only available for public transport routes']);
});

it('returns 422 when alternative index is out of range', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'public-transport',
        'alternatives' => [
            [
                'distance' => 30000,
                'duration' => 2400,
                'geometry' => [[13.4, 52.5]],
                'transit_details' => ['steps' => []],
            ],
        ],
    ]);

    $response = $this->patchJson("/routes/{$route->id}/alternative", [
        'alternative_index' => 5,
    ]);

    $response->assertStatus(422)
        ->assertJson(['error' => 'Alternative index out of range']);
});

it('validates alternative_index is required and is a non-negative integer', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'public-transport',
    ]);

    $this->patchJson("/routes/{$route->id}/alternative", [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['alternative_index']);

    $this->patchJson("/routes/{$route->id}/alternative", ['alternative_index' => -1])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['alternative_index']);
});

it('cannot adopt an alternative on another users route', function () {
    $otherUser = User::factory()->create();
    $otherTrip = Trip::factory()->create(['user_id' => $otherUser->id]);
    $otherStart = Marker::factory()->create(['trip_id' => $otherTrip->id]);
    $otherEnd = Marker::factory()->create(['trip_id' => $otherTrip->id]);

    $route = Route::factory()->create([
        'trip_id' => $otherTrip->id,
        'start_marker_id' => $otherStart->id,
        'end_marker_id' => $otherEnd->id,
        'transport_mode' => 'public-transport',
        'alternatives' => [
            [
                'distance' => 10000,
                'duration' => 900,
                'geometry' => [[13.4, 52.5]],
                'transit_details' => ['steps' => []],
            ],
        ],
    ]);

    $response = $this->patchJson("/routes/{$route->id}/alternative", [
        'alternative_index' => 0,
    ]);

    $response->assertForbidden();
});

it('can create a route with tour_id', function () {
    // Create a tour for this trip
    $tour = \App\Models\Tour::factory()->create(['trip_id' => $this->trip->id]);

    // Set Mapbox token for test
    config(['services.mapbox.access_token' => 'test-token']);

    // Mock Mapbox API response
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [
                [
                    'distance' => 15000,
                    'duration' => 1200,
                    'geometry' => [
                        'type' => 'LineString',
                        'coordinates' => [
                            [13.388860, 52.517037],
                            [13.397634, 52.529407],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertCreated()
        ->assertJsonPath('tour_id', $tour->id);

    $this->assertDatabaseHas('routes', [
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
    ]);
});

it('can create a route with waypoints and stores them in the database', function () {
    config(['services.mapbox.access_token' => 'test-token']);

    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [
                [
                    'distance' => 15000,
                    'duration' => 900,
                    'geometry' => [
                        'coordinates' => [
                            [$this->startMarker->longitude, $this->startMarker->latitude],
                            [1.5, 49.0],
                            [$this->endMarker->longitude, $this->endMarker->latitude],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $waypoints = [
        ['lat' => 49.0, 'lng' => 1.5],
    ];

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'foot-walking',
        'waypoints' => $waypoints,
    ]);

    $response->assertCreated()
        ->assertJsonPath('waypoints.0.lat', 49)
        ->assertJsonPath('waypoints.0.lng', 1.5);

    $this->assertDatabaseHas('routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'foot-walking',
        'waypoints' => json_encode($waypoints),
    ]);
});

it('creates a route without waypoints when not provided', function () {
    config(['services.mapbox.access_token' => 'test-token']);

    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'routes' => [
                [
                    'distance' => 10000,
                    'duration' => 600,
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
        ->assertJsonPath('waypoints', null);
});

it('rejects waypoints with invalid latitude', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'foot-walking',
        'waypoints' => [
            ['lat' => 999.0, 'lng' => 1.5],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['waypoints.0.lat']);
});

it('rejects waypoints with invalid longitude', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'foot-walking',
        'waypoints' => [
            ['lat' => 49.0, 'lng' => 999.0],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['waypoints.0.lng']);
});

it('rejects more than 20 waypoints', function () {
    $tooManyWaypoints = array_fill(0, 21, ['lat' => 49.0, 'lng' => 1.5]);

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'foot-walking',
        'waypoints' => $tooManyWaypoints,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['waypoints']);
});
