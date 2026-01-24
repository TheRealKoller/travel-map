<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('authenticated user can view trip preview with invitation token', function () {
    $trip = Trip::factory()->create([
        'user_id' => User::factory()->create()->id,
        'name' => 'Shared Trip',
        'invitation_token' => 'test-token-123',
    ]);

    $response = $this->actingAs($this->user)->get('/trips/preview/test-token-123');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('trips/preview')
            ->has('trip')
            ->where('trip.name', 'Shared Trip')
            ->where('isCollaborator', false)
        );
});

test('authenticated user can join a trip using invitation token', function () {
    $owner = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Shared Trip',
        'invitation_token' => 'test-token-456',
    ]);

    $response = $this->actingAs($this->user)->postJson('/trips/preview/test-token-456/join');

    $response->assertStatus(200)
        ->assertJsonFragment(['message' => 'Successfully joined the trip']);

    // Verify user is now a collaborator
    $this->assertDatabaseHas('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'role' => 'editor',
    ]);
});

test('user cannot join trip they already own', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'My Trip',
        'invitation_token' => 'test-token-789',
    ]);

    $response = $this->actingAs($this->user)->postJson('/trips/preview/test-token-789/join');

    $response->assertStatus(400)
        ->assertJsonFragment(['message' => 'You are already the owner of this trip']);

    // Verify no duplicate entry in trip_user
    $this->assertDatabaseMissing('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
    ]);
});

test('user cannot join trip they are already a collaborator on', function () {
    $owner = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Shared Trip',
        'invitation_token' => 'test-token-abc',
    ]);

    // Add user as collaborator first
    $trip->sharedUsers()->attach($this->user->id, ['role' => 'editor']);

    $response = $this->actingAs($this->user)->postJson('/trips/preview/test-token-abc/join');

    $response->assertStatus(400)
        ->assertJsonFragment(['message' => 'You are already a collaborator on this trip']);
});

test('joined trip appears in users trip list', function () {
    $owner = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Shared Trip',
        'invitation_token' => 'test-token-xyz',
    ]);

    // Join the trip
    $this->actingAs($this->user)->postJson('/trips/preview/test-token-xyz/join');

    // Verify trip appears in user's accessible trips
    $response = $this->actingAs($this->user)->getJson('/trips');

    $response->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment(['name' => 'Shared Trip']);
});

test('collaborator sees correct status on preview page', function () {
    $owner = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Shared Trip',
        'invitation_token' => 'test-token-def',
    ]);

    // Add user as collaborator
    $trip->sharedUsers()->attach($this->user->id, ['role' => 'editor']);

    $response = $this->actingAs($this->user)->get('/trips/preview/test-token-def');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('trips/preview')
            ->where('isCollaborator', true)
        );
});

test('unauthenticated user cannot join trip', function () {
    $trip = Trip::factory()->create([
        'user_id' => User::factory()->create()->id,
        'invitation_token' => 'test-token-ghi',
    ]);

    $response = $this->postJson('/trips/preview/test-token-ghi/join');

    $response->assertStatus(401);
});

test('joining trip with invalid token returns 404', function () {
    $response = $this->actingAs($this->user)->postJson('/trips/preview/invalid-token/join');

    $response->assertStatus(404);
});

test('owner sees collaborator status on their own trip preview', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'My Trip',
        'invitation_token' => 'test-token-owner',
    ]);

    $response = $this->actingAs($this->user)->get('/trips/preview/test-token-owner');

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('trips/preview')
            ->where('isCollaborator', true)
        );
});
