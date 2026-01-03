<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('marker creation requires a name', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => '', // Empty name
        'type' => 'point of interest',
        'notes' => 'Test notes',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('marker creation allows empty notes', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'notes' => '', // Empty notes should be allowed
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
    ]);
});

test('marker creation allows null notes', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        // notes field omitted - should be allowed
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
    ]);
});

test('marker update requires name when provided', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Original Name',
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'name' => '', // Empty name should fail
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('marker update allows empty notes', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Test Location',
        'notes' => 'Original notes',
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'notes' => '', // Empty notes should be allowed
    ]);

    $response->assertStatus(200);

    // Empty string is stored as null in database, which is fine
    $marker->refresh();
    expect($marker->notes)->toBeNull();
});

test('marker update allows null notes', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Test Location',
        'notes' => 'Original notes',
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'notes' => null, // Null notes should be allowed
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'notes' => null,
    ]);
});

test('marker creation allows valid url', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'url' => 'https://example.com',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
        'url' => 'https://example.com',
    ]);
});

test('marker creation allows empty url', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'url' => '',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);
});

test('marker creation allows null url', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        // url field omitted - should be allowed
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);
});

test('marker creation rejects invalid url', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'url' => 'not a valid url',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['url']);
});

test('marker update allows valid url', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Test Location',
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'url' => 'https://example.com',
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'url' => 'https://example.com',
    ]);
});

test('marker update rejects invalid url', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Test Location',
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'url' => 'invalid url',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['url']);
});

test('marker update allows null url', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Test Location',
        'url' => 'https://example.com',
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'url' => null,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'url' => null,
    ]);
});
