<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    
    // Set a fake Mapbox access token for tests
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing']);
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
    // Mock the Mapbox Geocoding API response
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'features' => [
                [
                    'id' => 'poi.1',
                    'type' => 'Feature',
                    'place_name' => 'Place 1',
                    'text' => 'Place 1',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6503, 35.6762]],
                    'properties' => ['category' => 'restaurant'],
                ],
                [
                    'id' => 'poi.2',
                    'type' => 'Feature',
                    'place_name' => 'Place 2',
                    'text' => 'Place 2',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6504, 35.6763]],
                    'properties' => ['category' => 'hotel'],
                ],
                [
                    'id' => 'poi.3',
                    'type' => 'Feature',
                    'place_name' => 'Place 3',
                    'text' => 'Place 3',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6505, 35.6764]],
                    'properties' => ['category' => 'bakery'],
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
            'count' => 3,
            'error' => null,
        ])
        ->assertJsonStructure([
            'count',
            'results' => [
                '*' => ['lat', 'lon'],
            ],
            'error',
        ]);

    $results = $response->json('results');
    expect($results)->toHaveCount(3);
    expect($results[0])->toHaveKey('lat');
    expect($results[0])->toHaveKey('lon');
    expect($results[0]['lat'])->toBe(35.6762);
    expect($results[0]['lon'])->toBe(139.6503);
});

test('search nearby handles empty results', function () {
    // Mock the Mapbox Geocoding API response with no features
    Http::fake([
        'api.mapbox.com/*' => Http::response([
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
    // Mock the Mapbox Geocoding API to return an error
    Http::fake([
        'api.mapbox.com/*' => Http::response([], 500),
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
    // Mock the Mapbox Geocoding API response
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'features' => [
                [
                    'id' => 'poi.1',
                    'type' => 'Feature',
                    'place_name' => 'Hotel 1',
                    'text' => 'Hotel 1',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6503, 35.6762]],
                    'properties' => ['category' => 'hotel'],
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
            'count' => 1,
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
    // Mock the Mapbox Geocoding API response with various data combinations
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'features' => [
                // Element with name and category type
                [
                    'id' => 'poi.1',
                    'type' => 'Feature',
                    'place_name' => 'Restaurant A',
                    'text' => 'Restaurant A',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6503, 35.6762]],
                    'properties' => ['category' => 'restaurant'],
                ],
                // Element with name and category type
                [
                    'id' => 'poi.2',
                    'type' => 'Feature',
                    'place_name' => 'Hotel B',
                    'text' => 'Hotel B',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6504, 35.6763]],
                    'properties' => ['category' => 'hotel'],
                ],
                // Element without name but with category type
                [
                    'id' => 'poi.3',
                    'type' => 'Feature',
                    'text' => 'Bakery',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6505, 35.6764]],
                    'properties' => ['category' => 'bakery'],
                ],
                // Element with only coordinates (no category)
                [
                    'id' => 'poi.4',
                    'type' => 'Feature',
                    'place_name' => 'Unknown Place',
                    'text' => 'Unknown Place',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6506, 35.6765]],
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

    expect($results)->toHaveCount(4);

    // First result should have name and type
    expect($results[0]['lat'])->toBe(35.6762);
    expect($results[0]['lon'])->toBe(139.6503);
    expect($results[0]['name'])->toBe('Restaurant A');
    expect($results[0]['type'])->toBe('restaurant');

    // Second result should have name and type
    expect($results[1]['name'])->toBe('Hotel B');
    expect($results[1]['type'])->toBe('hotel');

    // Third result should have name but type can be optional
    expect($results[2]['name'])->toBe('Bakery');
    expect($results[2]['type'])->toBe('bakery');

    // Fourth result should have name but no type
    expect($results[3]['name'])->toBe('Unknown Place');
    expect($results[3])->not->toHaveKey('type');
});

test('search results skip elements without coordinates', function () {
    // Mock the Mapbox Geocoding API response with some features missing coordinates
    Http::fake([
        'api.mapbox.com/*' => Http::response([
            'features' => [
                // Valid element with coordinates
                [
                    'id' => 'poi.1',
                    'type' => 'Feature',
                    'place_name' => 'Valid Place',
                    'text' => 'Valid Place',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6503, 35.6762]],
                    'properties' => [],
                ],
                // Element without coordinates (should be filtered out)
                [
                    'id' => 'poi.2',
                    'type' => 'Feature',
                    'place_name' => 'No Coordinates',
                    'text' => 'No Coordinates',
                    'geometry' => ['type' => 'Point', 'coordinates' => []],
                    'properties' => [],
                ],
                // Another valid element
                [
                    'id' => 'poi.3',
                    'type' => 'Feature',
                    'place_name' => 'Another Valid',
                    'text' => 'Another Valid',
                    'geometry' => ['type' => 'Point', 'coordinates' => [139.6505, 35.6764]],
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

    // Should only return the 2 valid elements
    expect($results)->toHaveCount(2);
    expect($results[0]['name'])->toBe('Valid Place');
    expect($results[1]['name'])->toBe('Another Valid');

    // Count should match the filtered results
    expect($response->json('count'))->toBe(2);
});
