<?php

use App\Services\MapboxStaticImageService;
use Illuminate\Support\Facades\Log;

beforeEach(function () {
    $this->service = new MapboxStaticImageService('test_access_token');
});

test('generates static image URL with markers and routes', function () {
    $markers = [
        ['latitude' => 52.5200, 'longitude' => 13.4050], // Berlin
        ['latitude' => 48.1351, 'longitude' => 11.5820], // Munich
    ];

    $routes = [
        [
            'geometry' => [
                [13.4050, 52.5200], // Berlin (lng, lat)
                [13.5, 52.0],
                [12.5, 51.0],
                [11.5, 50.0],
                [11.5820, 48.1351], // Munich (lng, lat)
            ],
        ],
    ];

    $url = $this->service->generateStaticImageWithMarkersAndRoutes(
        markers: $markers,
        routes: $routes,
        width: 800,
        height: 600
    );

    expect($url)->not->toBeNull()
        ->and($url)->toContain('api.mapbox.com/styles/v1')
        ->and($url)->toContain('the-koller/cmkk2r7cg00gl01r15b1achfj')
        ->and($url)->toContain('path-3+0000ff-0.7(') // Route path overlay
        ->and($url)->toContain('pin-s+ff0000(') // Marker overlays
        ->and($url)->toContain('800x600')
        ->and($url)->toContain('access_token=test_access_token');
});

test('generates static image URL with multiple routes', function () {
    $markers = [
        ['latitude' => 52.5200, 'longitude' => 13.4050], // Berlin
        ['latitude' => 50.1109, 'longitude' => 8.6821], // Frankfurt
        ['latitude' => 48.1351, 'longitude' => 11.5820], // Munich
    ];

    $routes = [
        [
            'geometry' => [
                [13.4050, 52.5200], // Berlin to Frankfurt
                [12.0, 51.0],
                [10.0, 50.0],
                [8.6821, 50.1109], // Frankfurt
            ],
        ],
        [
            'geometry' => [
                [8.6821, 50.1109], // Frankfurt to Munich
                [9.5, 49.5],
                [10.5, 49.0],
                [11.5820, 48.1351], // Munich
            ],
        ],
    ];

    $url = $this->service->generateStaticImageWithMarkersAndRoutes(
        markers: $markers,
        routes: $routes,
        width: 800,
        height: 600
    );

    expect($url)->not->toBeNull();

    // Count path overlays - should have 2 routes
    $pathCount = substr_count($url, 'path-3+0000ff-0.7(');
    expect($pathCount)->toBe(2);

    // Should have 3 markers
    $markerCount = substr_count($url, 'pin-s+ff0000(');
    expect($markerCount)->toBe(3);
});

test('handles empty routes gracefully', function () {
    $markers = [
        ['latitude' => 52.5200, 'longitude' => 13.4050],
        ['latitude' => 48.1351, 'longitude' => 11.5820],
    ];

    $routes = [];

    $url = $this->service->generateStaticImageWithMarkersAndRoutes(
        markers: $markers,
        routes: $routes,
        width: 800,
        height: 600
    );

    // Should still generate URL with markers only
    expect($url)->not->toBeNull()
        ->and($url)->not->toContain('path-3+0000ff-0.7(')
        ->and($url)->toContain('pin-s+ff0000(');
});

test('handles routes with empty geometry', function () {
    $markers = [
        ['latitude' => 52.5200, 'longitude' => 13.4050],
        ['latitude' => 48.1351, 'longitude' => 11.5820],
    ];

    $routes = [
        ['geometry' => []],
        ['geometry' => null],
    ];

    $url = $this->service->generateStaticImageWithMarkersAndRoutes(
        markers: $markers,
        routes: $routes,
        width: 800,
        height: 600
    );

    // Should generate URL with markers only, no path overlays
    expect($url)->not->toBeNull()
        ->and($url)->not->toContain('path-3+0000ff-0.7(')
        ->and($url)->toContain('pin-s+ff0000(');
});

test('simplifies long route geometry to avoid URL length limits', function () {
    $markers = [
        ['latitude' => 52.5200, 'longitude' => 13.4050],
        ['latitude' => 48.1351, 'longitude' => 11.5820],
    ];

    // Create a route with many points
    $geometry = [];
    for ($i = 0; $i < 200; $i++) {
        $geometry[] = [13.4050 + ($i * 0.01), 52.5200 - ($i * 0.02)];
    }

    $routes = [
        ['geometry' => $geometry],
    ];

    $url = $this->service->generateStaticImageWithMarkersAndRoutes(
        markers: $markers,
        routes: $routes,
        width: 800,
        height: 600
    );

    expect($url)->not->toBeNull()
        ->and($url)->toContain('path-3+0000ff-0.7(');

    // URL should be under Mapbox's limit (approximately 8192 chars)
    expect(strlen($url))->toBeLessThan(8192);
});

test('returns null when no markers provided', function () {
    Log::shouldReceive('info')->once();

    $url = $this->service->generateStaticImageWithMarkersAndRoutes(
        markers: [],
        routes: [],
        width: 800,
        height: 600
    );

    expect($url)->toBeNull();
});

test('returns null when no access token configured', function () {
    Log::shouldReceive('warning')->once();

    $service = new MapboxStaticImageService(null);

    $markers = [
        ['latitude' => 52.5200, 'longitude' => 13.4050],
    ];

    $url = $service->generateStaticImageWithMarkersAndRoutes(
        markers: $markers,
        routes: [],
        width: 800,
        height: 600
    );

    expect($url)->toBeNull();
});
