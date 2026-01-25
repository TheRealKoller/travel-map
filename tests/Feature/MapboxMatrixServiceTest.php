<?php

use App\Models\Marker;
use App\Services\MapboxMatrixService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    // Configure Mapbox token
    config(['services.mapbox.access_token' => 'pk.test.fake_token']);
});

test('calculates matrix for multiple markers successfully', function () {
    // Create test markers
    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
        new Marker(['id' => 'marker3', 'latitude' => 46.9480, 'longitude' => 7.4474]),
    ];

    // Mock the Mapbox Matrix API response
    Http::fake([
        '*' => Http::response([
            'code' => 'Ok',
            'durations' => [
                [0, 3234.5, 5123.2],
                [3234.5, 0, 4234.1],
                [5123.2, 4234.1, 0],
            ],
            'distances' => [
                [0, 101234.5, 153423.8],
                [101234.5, 0, 132345.2],
                [153423.8, 132345.2, 0],
            ],
        ], 200),
    ]);

    $service = app(MapboxMatrixService::class);
    $result = $service->calculateMatrix($markers);

    expect($result)->toHaveKeys(['durations', 'distances'])
        ->and($result['durations'])->toBeArray()
        ->and($result['distances'])->toBeArray()
        ->and(count($result['durations']))->toBe(3)
        ->and(count($result['distances']))->toBe(3)
        ->and($result['durations'][0][1])->toBe(3234.5)
        ->and($result['distances'][0][1])->toBe(101234.5);
});

test('throws exception when less than 2 markers provided', function () {
    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
    ];

    $service = app(MapboxMatrixService::class);
    $service->calculateMatrix($markers);
})->throws(\InvalidArgumentException::class, 'At least 2 markers are required');

test('throws exception when more than 25 markers provided', function () {
    $markers = [];
    for ($i = 0; $i < 26; $i++) {
        $markers[] = new Marker([
            'id' => "marker{$i}",
            'latitude' => 47.3769 + ($i * 0.01),
            'longitude' => 8.5417 + ($i * 0.01),
        ]);
    }

    $service = app(MapboxMatrixService::class);
    $service->calculateMatrix($markers);
})->throws(\InvalidArgumentException::class, 'Too many markers');

test('throws exception when Mapbox token is not configured', function () {
    config(['services.mapbox.access_token' => null]);

    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
    ];

    $service = app(MapboxMatrixService::class);
    $service->calculateMatrix($markers);
})->throws(\App\Exceptions\RoutingProviderException::class, 'Mapbox access token not configured');

test('throws exception when API request fails', function () {
    Http::fake([
        '*' => Http::response(['error' => 'Server error'], 500),
    ]);

    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
    ];

    $service = app(MapboxMatrixService::class);
    $service->calculateMatrix($markers);
})->throws(\App\Exceptions\RoutingProviderException::class);

test('throws exception when response is missing required fields', function () {
    Http::fake([
        '*' => Http::response(['code' => 'Ok'], 200),
    ]);

    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
    ];

    $service = app(MapboxMatrixService::class);
    $service->calculateMatrix($markers);
})->throws(\App\Exceptions\RoutingProviderException::class, 'Invalid response from Mapbox Matrix API');

test('uses walking profile for matrix calculation', function () {
    Http::fake([
        '*' => Http::response([
            'code' => 'Ok',
            'durations' => [[0, 100], [100, 0]],
            'distances' => [[0, 1000], [1000, 0]],
        ], 200),
    ]);

    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
    ];

    $service = app(MapboxMatrixService::class);
    $service->calculateMatrix($markers);

    // Verify walking profile is used
    Http::assertSent(function ($request) {
        return str_contains($request->url(), '/walking/');
    });
});

test('formats coordinates correctly for API request', function () {
    Http::fake([
        '*' => Http::response([
            'code' => 'Ok',
            'durations' => [[0, 100], [100, 0]],
            'distances' => [[0, 1000], [1000, 0]],
        ], 200),
    ]);

    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
    ];

    $service = app(MapboxMatrixService::class);
    $service->calculateMatrix($markers);

    // Verify coordinates are in longitude,latitude format separated by semicolons
    Http::assertSent(function ($request) {
        return str_contains($request->url(), '8.5417,47.3769;7.5886,47.5596');
    });
});
