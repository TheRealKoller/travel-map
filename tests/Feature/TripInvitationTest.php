<?php

use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('trip owner can generate invitation token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token");

    $response->assertOk();
    $response->assertJsonStructure([
        'token',
        'url',
    ]);

    // Verify token was saved to database
    $trip->refresh();
    expect($trip->invitation_token)->not->toBeNull();
    expect($response->json('token'))->toBe($trip->invitation_token);
    expect($response->json('url'))->toBe($trip->getInvitationUrl());
});

test('non-owner cannot generate invitation token', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    $response = $this
        ->actingAs($otherUser)
        ->postJson("/trips/{$trip->id}/generate-invitation-token");

    $response->assertForbidden();
});

test('unauthenticated user cannot generate invitation token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this->postJson("/trips/{$trip->id}/generate-invitation-token");

    $response->assertUnauthorized();
});

test('authenticated user can access trip preview with valid token', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    // Generate invitation token
    $token = $trip->generateInvitationToken();

    // Access preview page as a different user
    $response = $this
        ->actingAs($viewer)
        ->get("/trips/preview/{$token}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('trips/preview')
        ->has('trip')
        ->where('trip.id', $trip->id)
        ->where('trip.name', $trip->name));
});

test('unauthenticated user cannot access trip preview', function () {
    $owner = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    // Generate invitation token
    $token = $trip->generateInvitationToken();

    // Try to access preview page without authentication
    $response = $this->get("/trips/preview/{$token}");

    $response->assertRedirect(route('login'));
});

test('trip preview returns 404 for invalid token', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/trips/preview/invalid-token');

    $response->assertNotFound();
});

test('trip preview includes markers', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    // Create markers for the trip
    $markers = [];
    for ($i = 0; $i < 3; $i++) {
        $markers[] = \App\Models\Marker::factory()->create([
            'trip_id' => $trip->id,
            'name' => "Marker {$i}",
        ]);
    }

    $token = $trip->generateInvitationToken();

    $response = $this
        ->actingAs($viewer)
        ->get("/trips/preview/{$token}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('trips/preview')
        ->has('trip.markers', 3)
        ->where('trip.markers.0.name', 'Marker 0')
        ->where('trip.markers.1.name', 'Marker 1')
        ->where('trip.markers.2.name', 'Marker 2'));
});

test('generating new token replaces old token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    // Generate first token
    $firstToken = $trip->generateInvitationToken();

    // Generate second token
    $secondToken = $trip->generateInvitationToken();

    // Tokens should be different
    expect($firstToken)->not->toBe($secondToken);

    // Trip should have the new token
    $trip->refresh();
    expect($trip->invitation_token)->toBe($secondToken);
});

test('invitation URL is correctly formatted', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $token = $trip->generateInvitationToken();
    $expectedUrl = url("/trips/preview/{$token}");

    expect($trip->getInvitationUrl())->toBe($expectedUrl);
});

test('trip without invitation token returns null URL', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $user->id,
        'invitation_token' => null,
    ]);

    expect($trip->getInvitationUrl())->toBeNull();
});

test('owner can generate invitation token with expiry in 7 days', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'expires_in' => 7,
        ]);

    $response->assertOk();
    $response->assertJsonStructure([
        'token',
        'url',
        'invitation_token_expires_at',
    ]);

    $trip->refresh();
    expect($trip->invitation_token_expires_at)->not->toBeNull();
    expect($trip->invitation_token_expires_at->isFuture())->toBeTrue();
    expect($trip->invitation_token_expires_at->between(now()->addDays(6), now()->addDays(8)))->toBeTrue();
});

test('owner can generate invitation token with expiry in 30 days', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'expires_in' => 30,
        ]);

    $response->assertOk();

    $trip->refresh();
    expect($trip->invitation_token_expires_at)->not->toBeNull();
    expect($trip->invitation_token_expires_at->between(now()->addDays(29), now()->addDays(31)))->toBeTrue();
});

test('generating invitation token without expires_in sets no expiry', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token");

    $trip->refresh();
    expect($trip->invitation_token_expires_at)->toBeNull();
});

test('owner can revoke invitation token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $trip->generateInvitationToken();

    $response = $this
        ->actingAs($user)
        ->deleteJson("/trips/{$trip->id}/invitation-token");

    $response->assertNoContent();

    $trip->refresh();
    expect($trip->invitation_token)->toBeNull();
    expect($trip->invitation_token_expires_at)->toBeNull();
});

test('non-owner cannot revoke invitation token', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $trip->generateInvitationToken();

    $response = $this
        ->actingAs($otherUser)
        ->deleteJson("/trips/{$trip->id}/invitation-token");

    $response->assertForbidden();
});

test('unauthenticated user cannot revoke invitation token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $trip->generateInvitationToken();

    $response = $this->deleteJson("/trips/{$trip->id}/invitation-token");

    $response->assertUnauthorized();
});

test('revoking token does not affect existing collaborators', function () {
    $owner = User::factory()->create();
    $collaborator = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $trip->generateInvitationToken();
    $trip->sharedUsers()->attach($collaborator->id, ['collaboration_role' => 'editor']);

    $this
        ->actingAs($owner)
        ->deleteJson("/trips/{$trip->id}/invitation-token");

    // Collaborator should still exist
    $this->assertDatabaseHas('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $collaborator->id,
        'collaboration_role' => 'editor',
    ]);
});

test('expired token shows expired state on preview page', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    // Generate token that is already expired
    $token = $trip->generateInvitationToken(now()->subDay());

    $response = $this
        ->actingAs($viewer)
        ->get("/trips/preview/{$token}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('trips/preview')
        ->where('tokenExpired', true)
        ->missing('trip')
    );
});

test('invalid expires_in value is rejected', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'expires_in' => 999,
        ]);

    $response->assertUnprocessable();
});
