<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('authenticated user can list tours for their trip', function () {
    Tour::factory()->count(3)->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->getJson("/tours?trip_id={$this->trip->id}");

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

test('authenticated user can create a tour', function () {
    $tourData = [
        'name' => 'Day 1 - Tokyo',
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/tours', $tourData);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Day 1 - Tokyo']);

    $this->assertDatabaseHas('tours', [
        'name' => 'Day 1 - Tokyo',
        'trip_id' => $this->trip->id,
    ]);
});

test('tour name is required when creating', function () {
    $response = $this->actingAs($this->user)->postJson('/tours', [
        'trip_id' => $this->trip->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('trip_id is required when creating a tour', function () {
    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'Day 1',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['trip_id']);
});

test('authenticated user can view their own tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => $tour->name]);
});

test('user cannot view another users tour', function () {
    $otherTrip = Trip::factory()->create();
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->actingAs($this->user)->getJson("/tours/{$otherTour->id}");

    $response->assertStatus(403);
});

test('authenticated user can update their own tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$tour->id}", [
        'name' => 'Updated Tour Name',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Tour Name']);

    $this->assertDatabaseHas('tours', [
        'id' => $tour->id,
        'name' => 'Updated Tour Name',
    ]);
});

test('user cannot update another users tour', function () {
    $otherTrip = Trip::factory()->create();
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$otherTour->id}", [
        'name' => 'Hacked Name',
    ]);

    $response->assertStatus(403);
});

test('authenticated user can delete their own tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$tour->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('tours', ['id' => $tour->id]);
});

test('user cannot delete another users tour', function () {
    $otherTrip = Trip::factory()->create();
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$otherTour->id}");

    $response->assertStatus(403);
});

test('authenticated user can attach marker to tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $tour->id,
    ]);
});

test('user cannot attach marker from different trip to tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $otherTrip->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(422);
});

test('authenticated user can detach marker from tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $tour->markers()->attach($marker->id);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $tour->id,
    ]);
});

test('unauthenticated user cannot access tour endpoints', function () {
    $this->getJson('/tours?trip_id=1')->assertStatus(401);
    $this->postJson('/tours', ['name' => 'Test', 'trip_id' => 1])->assertStatus(401);
    $this->getJson('/tours/1')->assertStatus(401);
    $this->putJson('/tours/1', ['name' => 'Test'])->assertStatus(401);
    $this->deleteJson('/tours/1')->assertStatus(401);
});
