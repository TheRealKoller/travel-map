<?php

use App\Exceptions\MapboxQuotaExceededException;
use App\Models\MapboxRequest;
use App\Models\User;
use App\Services\MapboxRequestLimiter;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    Config::set('services.mapbox.monthly_request_limit', 10);
});

test('limiter creates new record for current period', function () {
    $limiter = new MapboxRequestLimiter;

    expect(MapboxRequest::count())->toBe(0);

    $limiter->incrementCount();

    expect(MapboxRequest::count())->toBe(1);
    $record = MapboxRequest::first();
    expect($record->period)->toBe(now()->format('Y-m'));
    expect($record->count)->toBe(1);
});

test('limiter increments existing record', function () {
    $limiter = new MapboxRequestLimiter;

    $limiter->incrementCount();
    $limiter->incrementCount();
    $limiter->incrementCount();

    expect(MapboxRequest::count())->toBe(1);
    $record = MapboxRequest::first();
    expect($record->count)->toBe(3);
});

test('limiter throws exception when quota exceeded', function () {
    Config::set('services.mapbox.monthly_request_limit', 5);
    $limiter = new MapboxRequestLimiter;

    // Increment to limit
    for ($i = 0; $i < 5; $i++) {
        $limiter->checkQuota();
        $limiter->incrementCount();
    }

    // Should throw exception on next check
    expect(fn () => $limiter->checkQuota())
        ->toThrow(MapboxQuotaExceededException::class);
});

test('limiter allows requests when under quota', function () {
    Config::set('services.mapbox.monthly_request_limit', 10);
    $limiter = new MapboxRequestLimiter;

    // Increment to just below limit
    for ($i = 0; $i < 9; $i++) {
        $limiter->incrementCount();
    }

    // Should not throw exception
    $limiter->checkQuota();
    expect(true)->toBeTrue();
});

test('limiter returns accurate usage stats', function () {
    Config::set('services.mapbox.monthly_request_limit', 100);
    $limiter = new MapboxRequestLimiter;

    // Make some requests
    for ($i = 0; $i < 25; $i++) {
        $limiter->incrementCount();
    }

    $stats = $limiter->getUsageStats();
    expect($stats['period'])->toBe(now()->format('Y-m'));
    expect($stats['count'])->toBe(25);
    expect($stats['limit'])->toBe(100);
    expect($stats['remaining'])->toBe(75);
});

test('limiter updates last_request_at timestamp', function () {
    $limiter = new MapboxRequestLimiter;

    $limiter->incrementCount();

    $record = MapboxRequest::first();
    expect($record->last_request_at)->not->toBeNull();
    expect($record->last_request_at->isToday())->toBeTrue();
});

test('mapbox search increments request count on successful request', function () {
    Config::set('services.mapbox.access_token', 'test-token');
    Config::set('services.mapbox.monthly_request_limit', 100);

    \Illuminate\Support\Facades\Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => \Illuminate\Support\Facades\Http::response([
            'type' => 'FeatureCollection',
            'features' => [
                [
                    'type' => 'Feature',
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [139.6503, 35.6762],
                    ],
                    'properties' => [
                        'name' => 'Test Place',
                        'poi_category' => 'restaurant',
                    ],
                ],
            ],
        ], 200),
    ]);

    expect(MapboxRequest::count())->toBe(0);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200);

    // Check that requests were counted (one per category searched)
    $record = MapboxRequest::first();
    expect($record)->not->toBeNull();
    expect($record->count)->toBeGreaterThan(0);
});

test('mapbox search returns error when quota exceeded', function () {
    Config::set('services.mapbox.access_token', 'test-token');
    Config::set('services.mapbox.monthly_request_limit', 1);

    // Exhaust the quota
    $limiter = new MapboxRequestLimiter;
    $limiter->incrementCount();

    \Illuminate\Support\Facades\Http::fake([
        'api.mapbox.com/search/searchbox/v1/category/*' => \Illuminate\Support\Facades\Http::response([
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
        ->assertJsonStructure(['error', 'count', 'results']);

    expect($response->json('error'))->toContain('quota exceeded');
});

test('route calculation increments request count', function () {
    Config::set('services.mapbox.access_token', 'test-token');
    Config::set('services.mapbox.monthly_request_limit', 100);

    $user = User::factory()->withoutTwoFactor()->create();
    $trip = $user->trips()->create(['name' => 'Test Trip', 'description' => 'Test']);

    $marker1 = $trip->markers()->create([
        'id' => '11111111-1111-1111-1111-111111111111',
        'name' => 'Start',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'type' => 'point_of_interest',
        'user_id' => $user->id,
    ]);

    $marker2 = $trip->markers()->create([
        'id' => '22222222-2222-2222-2222-222222222222',
        'name' => 'End',
        'latitude' => 35.6812,
        'longitude' => 139.7671,
        'type' => 'point_of_interest',
        'user_id' => $user->id,
    ]);

    \Illuminate\Support\Facades\Http::fake([
        'api.mapbox.com/directions/*' => \Illuminate\Support\Facades\Http::response([
            'routes' => [
                [
                    'distance' => 10000,
                    'duration' => 1200,
                    'geometry' => [
                        'type' => 'LineString',
                        'coordinates' => [[139.6503, 35.6762], [139.7671, 35.6812]],
                    ],
                ],
            ],
        ], 200),
    ]);

    expect(MapboxRequest::count())->toBe(0);

    $response = $this->actingAs($user)->postJson('/routes', [
        'trip_id' => $trip->id,
        'start_marker_id' => $marker1->id,
        'end_marker_id' => $marker2->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertStatus(201);

    $record = MapboxRequest::first();
    expect($record)->not->toBeNull();
    expect($record->count)->toBe(1);
});

test('route calculation returns error when quota exceeded', function () {
    Config::set('services.mapbox.access_token', 'test-token');
    Config::set('services.mapbox.monthly_request_limit', 1);

    // Exhaust the quota
    $limiter = new MapboxRequestLimiter;
    $limiter->incrementCount();

    $user = User::factory()->withoutTwoFactor()->create();
    $trip = $user->trips()->create(['name' => 'Test Trip', 'description' => 'Test']);

    $marker1 = $trip->markers()->create([
        'id' => '11111111-1111-1111-1111-111111111111',
        'name' => 'Start',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'type' => 'point_of_interest',
        'user_id' => $user->id,
    ]);

    $marker2 = $trip->markers()->create([
        'id' => '22222222-2222-2222-2222-222222222222',
        'name' => 'End',
        'latitude' => 35.6812,
        'longitude' => 139.7671,
        'type' => 'point_of_interest',
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)->postJson('/routes', [
        'trip_id' => $trip->id,
        'start_marker_id' => $marker1->id,
        'end_marker_id' => $marker2->id,
        'transport_mode' => 'driving-car',
    ]);

    $response->assertStatus(429)
        ->assertJsonStructure(['error']);

    expect($response->json('error'))->toContain('quota exceeded');
});
