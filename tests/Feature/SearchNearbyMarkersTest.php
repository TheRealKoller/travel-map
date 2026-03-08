<?php

use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('search nearby requires latitude', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'longitude' => 13.405,
        'radius_km' => 5,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['latitude']);
});

test('search nearby requires longitude', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 52.52,
        'radius_km' => 5,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['longitude']);
});

test('search nearby requires radius_km', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 52.52,
        'longitude' => 13.405,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['radius_km']);
});

test('search nearby rejects out-of-range latitude', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 91,
        'longitude' => 13.405,
        'radius_km' => 5,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['latitude']);
});

test('search nearby rejects out-of-range longitude', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 52.52,
        'longitude' => 181,
        'radius_km' => 5,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['longitude']);
});

test('search nearby rejects radius_km below minimum', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 52.52,
        'longitude' => 13.405,
        'radius_km' => 0,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['radius_km']);
});

test('search nearby rejects radius_km above maximum', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 52.52,
        'longitude' => 13.405,
        'radius_km' => 101,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['radius_km']);
});

test('search nearby rejects invalid place_type value', function () {
    $response = $this->actingAs($this->user)->postJson('/markers/search-nearby', [
        'latitude' => 52.52,
        'longitude' => 13.405,
        'radius_km' => 5,
        'place_type' => 'not_a_valid_type',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['place_type']);
});
