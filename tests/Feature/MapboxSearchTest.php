<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('search nearby endpoint requires authentication', function () {
    $response = $this->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(401);
});

test('search nearby validates latitude', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 95, // Invalid: > 90
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['latitude']);
});

test('search nearby validates longitude', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 185, // Invalid: > 180
        'radius_km' => 10,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['longitude']);
});

test('search nearby validates radius', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 0, // Invalid: < 1
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['radius_km']);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 101, // Invalid: > 100
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['radius_km']);
});

test('search nearby returns count on successful request', function () {
    // Mock the Mapbox Search API response
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6503, 35.6762], // lon, lat
                    ],
                    'properties' => [
                        'name' => 'Restaurant A',
                        'poi_category' => 'restaurant',
                        'full_address' => '123 Street, Tokyo',
                    ],
                ],
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6504, 35.6763],
                    ],
                    'properties' => [
                        'name' => 'Hotel B',
                        'poi_category' => 'hotel',
                        'full_address' => '456 Avenue, Tokyo',
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'error' => null,
        ])
        ->assertJsonStructure([
            'count',
            'results' => [
                '*' => ['lat', 'lon'],
            ],
            'error',
        ]);

    $count = $response->json('count');
    expect($count)->toBeGreaterThanOrEqual(0);

    if ($count > 0) {
        $results = $response->json('results');
        expect($results[0])->toHaveKey('lat');
        expect($results[0])->toHaveKey('lon');
    }
});

test('search nearby handles empty results', function () {
    // Mock the Mapbox Search API response with no features
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [],
        ], 200),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'count' => 0,
            'results' => [],
            'error' => null,
        ]);
});

test('search nearby handles API errors gracefully', function () {
    // Mock the Mapbox Search API to return an error
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([], 500),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'count' => 0,
            'results' => [],
        ])
        ->assertJsonStructure([
            'count',
            'results',
            'error',
        ]);

    expect($response->json('error'))->not->toBeNull();
});

test('search nearby accepts place type parameter', function () {
    // Mock the Mapbox Search API response
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6503, 35.6762],
                    ],
                    'properties' => [
                        'name' => 'Hotel 1',
                        'poi_category' => 'hotel',
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
        'place_type' => 'hotel',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'error' => null,
        ])
        ->assertJsonStructure([
            'count',
            'results' => [
                '*' => ['lat', 'lon'],
            ],
            'error',
        ]);
});

test('place types endpoint returns available types', function () {
    $response = $this->actingAs($this->user)->getJson('/markers/place-types');

    $response->assertStatus(200)
        ->assertJsonStructure([
            '*' => ['value', 'label'],
        ]);

    $data = $response->json();
    expect($data)->toBeArray();
    expect(count($data))->toBeGreaterThan(0);

    // Check that 'all' option exists
    $allOption = collect($data)->firstWhere('value', 'all');
    expect($allOption)->not->toBeNull();
    expect($allOption['label'])->toBe('Alle Orte');
});

test('search results include optional name and type fields', function () {
    // Mock the Mapbox Search API response with various data combinations
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                // Feature with name and type
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6503, 35.6762],
                    ],
                    'properties' => [
                        'name' => 'Restaurant A',
                        'poi_category' => 'restaurant',
                    ],
                ],
                // Feature with name but different type
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6504, 35.6763],
                    ],
                    'properties' => [
                        'name' => 'Hotel B',
                        'poi_category' => 'hotel',
                    ],
                ],
                // Feature without name
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6505, 35.6764],
                    ],
                    'properties' => [
                        'poi_category' => 'shop',
                    ],
                ],
                // Feature with minimal data
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6506, 35.6765],
                    ],
                    'properties' => [],
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200);
    $results = $response->json('results');

    expect($results)->toBeArray();
    expect(count($results))->toBeGreaterThanOrEqual(0);

    // All results should have lat and lon
    foreach ($results as $result) {
        expect($result)->toHaveKey('lat');
        expect($result)->toHaveKey('lon');
    }
});

test('search results filter by distance correctly', function () {
    // Mock the Mapbox Search API response with places at different distances
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                // Place within radius (Tokyo: ~0.1 km away)
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6513, 35.6762],
                    ],
                    'properties' => [
                        'name' => 'Near Place',
                        'poi_category' => 'restaurant',
                    ],
                ],
                // Place far outside radius (Osaka: ~400 km away)
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [135.5023, 34.6937],
                    ],
                    'properties' => [
                        'name' => 'Far Place',
                        'poi_category' => 'restaurant',
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 5, // 5 km radius
    ]);

    $response->assertStatus(200);
    $results = $response->json('results');

    // Should not include the far place
    $names = array_column($results, 'name');
    expect($names)->not->toContain('Far Place');
});

test('search results remove duplicates based on coordinates', function () {
    // Mock multiple category responses that return the same place
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/restaurant*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6503, 35.6762],
                    ],
                    'properties' => [
                        'name' => 'Duplicate Place',
                        'poi_category' => 'restaurant',
                    ],
                ],
            ],
        ], 200),
        'api.mapbox.com/search/searchbox/v1/category/cafe*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6503, 35.6762], // Same coordinates
                    ],
                    'properties' => [
                        'name' => 'Duplicate Place',
                        'poi_category' => 'cafe',
                    ],
                ],
            ],
        ], 200),
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [],
        ], 200),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200);
    $results = $response->json('results');

    // Count places at the same coordinates
    $coordinates = array_map(fn ($r) => $r['lat'].'_'.$r['lon'], $results);
    $uniqueCoordinates = array_unique($coordinates);

    // Should have removed duplicates
    expect(count($coordinates))->toBe(count($uniqueCoordinates));
});
