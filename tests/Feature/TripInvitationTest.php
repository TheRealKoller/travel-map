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
