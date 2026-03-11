<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Trip;
use App\Models\User;

uses()->group('routes');

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->startMarker = Marker::factory()->create(['trip_id' => $this->trip->id]);
    $this->endMarker = Marker::factory()->create(['trip_id' => $this->trip->id]);
});

it('can create a manual public transport route without segments', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'manual-public-transport',
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
            'is_manual',
        ])
        ->assertJsonPath('is_manual', true)
        ->assertJsonPath('transport_mode.value', 'manual-public-transport')
        ->assertJsonPath('distance.meters', 0)
        ->assertJsonPath('duration.seconds', 0)
        ->assertJsonPath('geometry', [])
        ->assertJsonPath('transit_details', null);

    $this->assertDatabaseHas('routes', [
        'trip_id' => $this->trip->id,
        'transport_mode' => 'manual-public-transport',
        'is_manual' => true,
        'distance' => 0,
        'duration' => 0,
    ]);
});

it('can create a manual public transport route with transit segments', function () {
    $transitDetails = [
        'steps' => [
            [
                'travel_mode' => 'TRANSIT',
                'distance' => 50000,
                'duration' => 3600,
                'transit' => [
                    'departure_stop' => ['name' => 'Berlin Hbf', 'location' => null],
                    'arrival_stop' => ['name' => 'München Hbf', 'location' => null],
                    'line' => [
                        'name' => 'InterCityExpress',
                        'short_name' => 'ICE 27',
                        'color' => null,
                        'vehicle_type' => 'TRAIN',
                    ],
                    'departure_time' => null,
                    'arrival_time' => null,
                    'num_stops' => 3,
                    'headsign' => null,
                ],
            ],
        ],
        'departure_time' => '08:00',
        'arrival_time' => '11:00',
        'start_address' => null,
        'end_address' => null,
    ];

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'manual-public-transport',
        'transit_details' => $transitDetails,
    ]);

    $response->assertCreated()
        ->assertJsonPath('is_manual', true)
        ->assertJsonPath('transport_mode.value', 'manual-public-transport')
        ->assertJsonPath('transit_details.steps.0.travel_mode', 'TRANSIT')
        ->assertJsonPath('transit_details.steps.0.transit.departure_stop.name', 'Berlin Hbf')
        ->assertJsonPath('transit_details.steps.0.transit.line.short_name', 'ICE 27')
        ->assertJsonPath('transit_details.departure_time', '08:00')
        ->assertJsonPath('transit_details.arrival_time', '11:00');

    $route = Route::find($response->json('id'));
    expect($route->is_manual)->toBeTrue()
        ->and($route->transit_details)->toBeArray()
        ->and($route->transit_details['steps'])->toHaveCount(1)
        ->and($route->transit_details['steps'][0]['transit']['departure_stop']['name'])->toBe('Berlin Hbf');
});

it('does not call any external routing API for manual public transport routes', function () {
    \Illuminate\Support\Facades\Http::preventStrayRequests();

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'manual-public-transport',
    ]);

    $response->assertCreated();
    \Illuminate\Support\Facades\Http::assertNothingSent();
});

it('ignores waypoints provided for manual public transport routes', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'manual-public-transport',
        'waypoints' => [
            ['lat' => 51.5, 'lng' => 10.0],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('waypoints', null);

    $this->assertDatabaseHas('routes', [
        'id' => $response->json('id'),
        'waypoints' => null,
    ]);
});

it('includes is_manual field in route list response', function () {
    Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'manual-public-transport',
        'is_manual' => true,
    ]);

    $response = $this->getJson("/routes?trip_id={$this->trip->id}");

    $response->assertOk()
        ->assertJsonStructure(['*' => ['is_manual']])
        ->assertJsonPath('0.is_manual', true);
});

it('rejects transit_details with invalid structure', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'manual-public-transport',
        'transit_details' => [
            'steps' => 'not-an-array',
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['transit_details.steps']);
});

it('accepts manual-public-transport as a valid transport mode', function () {
    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'manual-public-transport',
    ]);

    $response->assertCreated();
});

it('stores is_manual as false for regular routes', function () {
    config(['services.mapbox.access_token' => 'test-token']);

    \Illuminate\Support\Facades\Http::fake([
        'api.mapbox.com/*' => \Illuminate\Support\Facades\Http::response([
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
        ->assertJsonPath('is_manual', false);

    $this->assertDatabaseHas('routes', [
        'id' => $response->json('id'),
        'is_manual' => false,
    ]);
});

it('rejects transit_details when transport mode is not manual-public-transport', function () {
    \Illuminate\Support\Facades\Http::preventStrayRequests();

    $response = $this->postJson('/routes', [
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'transport_mode' => 'driving-car',
        'transit_details' => [
            'steps' => [],
            'departure_time' => null,
            'arrival_time' => null,
            'start_address' => null,
            'end_address' => null,
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['transit_details']);
});
