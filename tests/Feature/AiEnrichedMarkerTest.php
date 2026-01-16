<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('marker can be created with ai_enriched flag set to true', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
        'ai_enriched' => true,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
        'ai_enriched' => true,
    ]);
});

test('marker can be created with ai_enriched flag set to false', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
        'ai_enriched' => false,
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
        'ai_enriched' => false,
    ]);
});

test('marker defaults to ai_enriched false when not provided', function () {
    $markerData = [
        'id' => fake()->uuid(),
        'name' => 'Test Location',
        'type' => 'point of interest',
        'latitude' => 35.6762,
        'longitude' => 139.6503,
        'trip_id' => $this->trip->id,
        // ai_enriched field omitted
    ];

    $response = $this->actingAs($this->user)->postJson('/markers', $markerData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('markers', [
        'name' => 'Test Location',
        'ai_enriched' => false,
    ]);
});

test('marker can be updated to set ai_enriched to true', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Test Location',
        'ai_enriched' => false,
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'ai_enriched' => true,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'ai_enriched' => true,
    ]);
});

test('marker can be updated to set ai_enriched to false', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Test Location',
        'ai_enriched' => true,
    ]);

    $response = $this->actingAs($this->user)->putJson("/markers/{$marker->id}", [
        'ai_enriched' => false,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('markers', [
        'id' => $marker->id,
        'ai_enriched' => false,
    ]);
});

test('marker index returns ai_enriched field', function () {
    Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'AI Enriched Location',
        'ai_enriched' => true,
    ]);

    Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'name' => 'Regular Location',
        'ai_enriched' => false,
    ]);

    $response = $this->actingAs($this->user)->getJson('/markers?trip_id='.$this->trip->id);

    $response->assertStatus(200)
        ->assertJsonCount(2)
        ->assertJsonFragment(['name' => 'AI Enriched Location', 'ai_enriched' => true])
        ->assertJsonFragment(['name' => 'Regular Location', 'ai_enriched' => false]);
});

test('marker ai_enriched field is cast to boolean', function () {
    $marker = Marker::factory()->create([
        'user_id' => $this->user->id,
        'trip_id' => $this->trip->id,
        'ai_enriched' => true,
    ]);

    $marker->refresh();

    expect($marker->ai_enriched)->toBeTrue();
    expect($marker->ai_enriched)->toBeBool();
});
