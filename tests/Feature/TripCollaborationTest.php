<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->owner = User::factory()->withoutTwoFactor()->create();
    $this->collaborator = User::factory()->withoutTwoFactor()->create();
    $this->otherUser = User::factory()->withoutTwoFactor()->create();
});

test('owner can add collaborator to trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->owner)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => $this->collaborator->email,
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['email' => $this->collaborator->email]);

    $this->assertDatabaseHas('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $this->collaborator->id,
        'collaboration_role' => 'editor',
    ]);
});

test('non-owner cannot add collaborator to trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->collaborator)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => $this->otherUser->email,
    ]);

    $response->assertStatus(403);
});

test('cannot add same user as collaborator twice', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->owner)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => $this->collaborator->email,
    ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['error' => 'User is already a collaborator']);
});

test('cannot add owner as collaborator', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->owner)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => $this->owner->email,
    ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['error' => 'User is already the owner of this trip']);
});

test('owner can remove collaborator from trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->owner)->deleteJson("/trips/{$trip->id}/collaborators/{$this->collaborator->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $this->collaborator->id,
    ]);
});

test('non-owner cannot remove collaborator from trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->collaborator)->deleteJson("/trips/{$trip->id}/collaborators/{$this->collaborator->id}");

    $response->assertStatus(403);
});

test('collaborator can view shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->collaborator)->getJson("/trips/{$trip->id}");

    $response->assertStatus(200)
        ->assertJsonFragment(['id' => $trip->id]);
});

test('collaborator can update shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->collaborator)->putJson("/trips/{$trip->id}", [
        'name' => 'Updated Trip Name',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Trip Name']);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'name' => 'Updated Trip Name',
    ]);
});

test('collaborator cannot delete shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->collaborator)->deleteJson("/trips/{$trip->id}");

    $response->assertStatus(403);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
    ]);
});

test('non-collaborator cannot view trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->otherUser)->getJson("/trips/{$trip->id}");

    $response->assertStatus(403);
});

test('shared trips appear in user trip list', function () {
    $ownedTrip = Trip::factory()->create(['user_id' => $this->collaborator->id]);
    $sharedTrip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $sharedTrip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->collaborator)->getJson('/trips');

    $response->assertStatus(200)
        ->assertJsonCount(2);

    $tripIds = collect($response->json())->pluck('id')->toArray();
    $this->assertContains($ownedTrip->id, $tripIds);
    $this->assertContains($sharedTrip->id, $tripIds);
});

test('collaborator can view markers in shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $marker = Marker::factory()->create([
        'user_id' => $this->owner->id,
        'trip_id' => $trip->id,
    ]);

    $response = $this->actingAs($this->collaborator)->getJson("/markers?trip_id={$trip->id}");

    $response->assertStatus(200)
        ->assertJsonFragment(['id' => $marker->id]);
});

test('collaborator can create markers in shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $markerId = \Illuminate\Support\Str::uuid()->toString();

    $response = $this->actingAs($this->collaborator)->postJson('/markers', [
        'id' => $markerId,
        'trip_id' => $trip->id,
        'name' => 'Shared Marker',
        'type' => 'city',
        'latitude' => 48.8566,
        'longitude' => 2.3522,
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Shared Marker']);

    $this->assertDatabaseHas('markers', [
        'trip_id' => $trip->id,
        'name' => 'Shared Marker',
        'user_id' => $this->collaborator->id,
    ]);
});

test('collaborator can update markers in shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $marker = Marker::factory()->create([
        'user_id' => $this->owner->id,
        'trip_id' => $trip->id,
    ]);

    $response = $this->actingAs($this->collaborator)->putJson("/markers/{$marker->id}", [
        'name' => 'Updated Marker Name',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Marker Name']);
});

test('collaborator can delete markers in shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $marker = Marker::factory()->create([
        'user_id' => $this->owner->id,
        'trip_id' => $trip->id,
    ]);

    $response = $this->actingAs($this->collaborator)->deleteJson("/markers/{$marker->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('markers', [
        'id' => $marker->id,
    ]);
});

test('collaborator can create tours in shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->collaborator)->postJson('/tours', [
        'trip_id' => $trip->id,
        'name' => 'Shared Tour',
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Shared Tour']);

    $this->assertDatabaseHas('tours', [
        'trip_id' => $trip->id,
        'name' => 'Shared Tour',
    ]);
});

test('collaborator can update tours in shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $response = $this->actingAs($this->collaborator)->putJson("/tours/{$tour->id}", [
        'name' => 'Updated Tour Name',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Tour Name']);
});

test('collaborator can delete tours in shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $tour = Tour::factory()->create(['trip_id' => $trip->id]);

    $response = $this->actingAs($this->collaborator)->deleteJson("/tours/{$tour->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('tours', [
        'id' => $tour->id,
    ]);
});

test('can list all collaborators for a trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->owner)->getJson("/trips/{$trip->id}/collaborators");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'owner' => ['id', 'name', 'email', 'collaboration_role'],
            'collaborators' => [
                '*' => ['id', 'name', 'email', 'collaboration_role'],
            ],
        ])
        ->assertJsonFragment(['email' => $this->owner->email, 'collaboration_role' => 'owner'])
        ->assertJsonFragment(['email' => $this->collaborator->email, 'collaboration_role' => 'editor']);
});

test('collaborator can access map for shared trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $trip->sharedUsers()->attach($this->collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->collaborator)->get("/map/{$trip->id}");

    $response->assertStatus(200);
});

test('non-collaborator cannot access map for trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->otherUser)->get("/map/{$trip->id}");

    $response->assertStatus(403);
});
