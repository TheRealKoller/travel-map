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
    // Mock the Overpass API response
    Http::fake([
        'overpass-api.de/*' => Http::response([
            'elements' => [
                ['type' => 'node', 'id' => 1, 'lat' => 35.6762, 'lon' => 139.6503],
                ['type' => 'node', 'id' => 2, 'lat' => 35.6763, 'lon' => 139.6504],
                ['type' => 'node', 'id' => 3, 'lat' => 35.6764, 'lon' => 139.6505],
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
        ]);
});

test('search nearby handles empty results', function () {
    // Mock the Overpass API response with no elements
    Http::fake([
        'overpass-api.de/*' => Http::response([
            'elements' => [],
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
            'error' => null,
        ]);
});

test('search nearby handles API errors gracefully', function () {
    // Mock the Overpass API to return an error
    Http::fake([
        'overpass-api.de/*' => Http::response([], 500),
    ]);

    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'radius_km' => 10,
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'count' => 0,
        ])
        ->assertJsonStructure([
            'count',
            'error',
        ]);

    expect($response->json('error'))->not->toBeNull();
});
