<?php

use App\Enums\TransportMode;
use App\Models\Marker;
use App\Services\RoutingService;
use Illuminate\Support\Facades\Http;

uses()->group('routing');

beforeEach(function () {
    config(['services.mapbox.access_token' => 'test-token']);

    $this->startMarker = new Marker([
        'latitude' => 48.8566,
        'longitude' => 2.3522,
    ]);

    $this->endMarker = new Marker([
        'latitude' => 51.5074,
        'longitude' => -0.1278,
    ]);
});

it('builds coordinate string without waypoints', function () {
    $capturedUrl = null;

    Http::fake(function ($request) use (&$capturedUrl) {
        $capturedUrl = $request->url();

        return Http::response([
            'routes' => [[
                'distance' => 10000,
                'duration' => 600,
                'geometry' => ['coordinates' => [[2.3522, 48.8566], [-0.1278, 51.5074]]],
            ]],
        ], 200);
    });

    $service = new RoutingService;
    $service->calculateRoute($this->startMarker, $this->endMarker, TransportMode::FootWalking);

    expect($capturedUrl)->toContain('2.3522,48.8566;-0.1278,51.5074');
});

it('builds coordinate string with a single waypoint', function () {
    $capturedUrl = null;

    Http::fake(function ($request) use (&$capturedUrl) {
        $capturedUrl = $request->url();

        return Http::response([
            'routes' => [[
                'distance' => 12000,
                'duration' => 700,
                'geometry' => ['coordinates' => [[2.3522, 48.8566], [1.0, 50.0], [-0.1278, 51.5074]]],
            ]],
        ], 200);
    });

    $service = new RoutingService;
    $service->calculateRoute(
        $this->startMarker,
        $this->endMarker,
        TransportMode::FootWalking,
        [['lat' => 50.0, 'lng' => 1.0]]
    );

    expect($capturedUrl)->toContain('2.3522,48.8566;1,50;-0.1278,51.5074');
});

it('builds coordinate string with multiple waypoints in correct order', function () {
    $capturedUrl = null;

    Http::fake(function ($request) use (&$capturedUrl) {
        $capturedUrl = $request->url();

        return Http::response([
            'routes' => [[
                'distance' => 15000,
                'duration' => 900,
                'geometry' => ['coordinates' => []],
            ]],
        ], 200);
    });

    $service = new RoutingService;
    $service->calculateRoute(
        $this->startMarker,
        $this->endMarker,
        TransportMode::DrivingCar,
        [
            ['lat' => 49.0, 'lng' => 1.5],
            ['lat' => 50.5, 'lng' => 0.5],
        ]
    );

    expect($capturedUrl)->toContain('2.3522,48.8566;1.5,49;0.5,50.5;-0.1278,51.5074');
});

it('ignores waypoints for public transport and routes via google api', function () {
    config(['services.google_maps.api_key' => 'test-google-key']);

    $googleCalled = false;
    $mapboxCalled = false;

    Http::fake([
        'routes.googleapis.com/*' => function () use (&$googleCalled) {
            $googleCalled = true;

            return Http::response([
                'routes' => [[
                    'distanceMeters' => 25000,
                    'duration' => '1800s',
                    'polyline' => ['encodedPolyline' => 'u{~vFvyys@'],
                    'legs' => [[
                        'localizedValues' => [
                            'departure' => ['time' => ['text' => '10:00']],
                            'arrival' => ['time' => ['text' => '10:30']],
                        ],
                        'steps' => [],
                    ]],
                ]],
            ], 200);
        },
        'api.mapbox.com/*' => function () use (&$mapboxCalled) {
            $mapboxCalled = true;

            return Http::response([], 200);
        },
    ]);

    $service = new RoutingService;
    $service->calculateRoute(
        $this->startMarker,
        $this->endMarker,
        TransportMode::PublicTransport,
        [['lat' => 50.0, 'lng' => 1.0]] // waypoints should be ignored
    );

    expect($googleCalled)->toBeTrue()
        ->and($mapboxCalled)->toBeFalse();
});
