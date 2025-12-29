<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('authenticated user can list their trips', function () {
    Trip::factory()->count(3)->create(['user_id' => $this->user->id]);
    Trip::factory()->count(2)->create(); // Other user's trips

    $response = $this->actingAs($this->user)->getJson('/trips');

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

test('authenticated user can create a trip', function () {
    $tripData = ['name' => 'Summer Vacation 2024'];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Summer Vacation 2024']);

    $this->assertDatabaseHas('trips', [
        'name' => 'Summer Vacation 2024',
        'user_id' => $this->user->id,
    ]);
});

test('trip name is required when creating', function () {
    $response = $this->actingAs($this->user)->postJson('/trips', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('authenticated user can view their own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->getJson("/trips/{$trip->id}");

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => $trip->name]);
});

test('user cannot view another users trip', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->getJson("/trips/{$otherTrip->id}");

    $response->assertStatus(403);
});

test('authenticated user can update their own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'name' => 'Updated Trip Name',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Trip Name']);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'name' => 'Updated Trip Name',
    ]);
});

test('user cannot update another users trip', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->putJson("/trips/{$otherTrip->id}", [
        'name' => 'Hacked Name',
    ]);

    $response->assertStatus(403);
});

test('authenticated user can delete their own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->deleteJson("/trips/{$trip->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('trips', ['id' => $trip->id]);
});

test('user cannot delete another users trip', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->deleteJson("/trips/{$otherTrip->id}");

    $response->assertStatus(403);
});

test('unauthenticated user cannot access trip endpoints', function () {
    $this->getJson('/trips')->assertStatus(401);
    $this->postJson('/trips', ['name' => 'Test'])->assertStatus(401);
    $this->getJson('/trips/1')->assertStatus(401);
    $this->putJson('/trips/1', ['name' => 'Test'])->assertStatus(401);
    $this->deleteJson('/trips/1')->assertStatus(401);
});
