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
                        'name' => 'Place 1',
                        'poi_category' => 'restaurant',
                    ],
                ],
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6504, 35.6763],
                    ],
                    'properties' => [
                        'name' => 'Place 2',
                        'poi_category' => 'hotel',
                    ],
                ],
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
            ],
        ], 200),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'count',
            'results' => [
                '*' => ['lat', 'lon'],
            ],
            'error',
        ]);

    $results = $response->json('results');
    // The service searches multiple categories, so we expect at least the mocked features
    // The count may be higher due to multiple category searches returning the same features
    expect(count($results))->toBeGreaterThanOrEqual(3);
    expect($results[0])->toHaveKey('lat');
    expect($results[0])->toHaveKey('lon');
    expect($results[0]['lat'])->toBe(35.6762);
    expect($results[0]['lon'])->toBe(139.6503);
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
        ->assertJsonStructure([
            'count',
            'results' => [
                '*' => ['lat', 'lon'],
            ],
            'error',
        ]);

    expect($response->json('count'))->toBeGreaterThanOrEqual(1);
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
                // Feature with name and different type
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
                // Feature without name but with shop type
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
                // Feature with only coordinates
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

    expect(count($results))->toBeGreaterThanOrEqual(4);

    // First result should have name and type
    expect($results[0]['lat'])->toBe(35.6762);
    expect($results[0]['lon'])->toBe(139.6503);
    expect($results[0]['name'])->toBe('Restaurant A');
    expect($results[0]['type'])->toBe('restaurant');

    // Second result should have name and type
    expect($results[1]['name'])->toBe('Hotel B');
    expect($results[1]['type'])->toBe('hotel');

    // Third result should have type but no name
    expect($results[2])->not->toHaveKey('name');
    expect($results[2]['type'])->toBe('shop');

    // Fourth result should have neither name nor type (or has default type)
    expect($results[3])->not->toHaveKey('name');
});

test('search results skip elements without coordinates', function () {
    // Mock the Mapbox Search API response with some features missing/invalid coordinates
    Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                // Valid feature with coordinates
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6503, 35.6762],
                    ],
                    'properties' => [
                        'name' => 'Valid Place',
                    ],
                ],
                // Feature without coordinates (should be filtered out)
                [
                    'type' => 'Feature',
                    'geometry' => [],
                    'properties' => [
                        'name' => 'No Coordinates',
                    ],
                ],
                // Another valid feature
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6505, 35.6764],
                    ],
                    'properties' => [
                        'name' => 'Another Valid',
                    ],
                ],
                // Feature with incomplete coordinates (should be filtered out)
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6505],
                    ],
                    'properties' => [
                        'name' => 'Only Lon',
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

    $response->assertStatus(200);
    $results = $response->json('results');

    // Should only return the 2 valid features
    // Using >= because the service searches multiple categories with the same mock
    expect(count($results))->toBeGreaterThanOrEqual(2);

    // Verify we have valid places (check that at least some expected results are there)
    $names = array_column($results, 'name');
    expect($names)->toContain('Valid Place');
    expect($names)->toContain('Another Valid');

    // Count should match the filtered results
    expect($response->json('count'))->toBe(count($results));
});
