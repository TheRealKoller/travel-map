<?php

use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Generate Invitation Token with Expiry ────────────────────────────────────

test('owner can generate invitation token with 7-day expiry', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'expires_in' => '7_days',
        ]);

    $response->assertOk();
    $response->assertJsonStructure(['token', 'url', 'invitation_role', 'invitation_token_expires_at']);

    $trip->refresh();
    expect($trip->invitation_token_expires_at)->not->toBeNull();
    expect($trip->invitation_token_expires_at->isFuture())->toBeTrue();
    expect($trip->invitation_token_expires_at->isAfter(now()->addDays(6)))->toBeTrue();
    expect($trip->invitation_token_expires_at->isBefore(now()->addDays(8)))->toBeTrue();
});

test('owner can generate invitation token with 30-day expiry', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'expires_in' => '30_days',
        ]);

    $response->assertOk();

    $trip->refresh();
    expect($trip->invitation_token_expires_at)->not->toBeNull();
    expect($trip->invitation_token_expires_at->isFuture())->toBeTrue();
    expect($trip->invitation_token_expires_at->isAfter(now()->addDays(29)))->toBeTrue();
    expect($trip->invitation_token_expires_at->isBefore(now()->addDays(31)))->toBeTrue();
});

test('owner can generate invitation token with no expiry', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $user->id,
        'invitation_token_expires_at' => now()->subDay(),
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'expires_in' => 'never',
        ]);

    $response->assertOk();

    $trip->refresh();
    expect($trip->invitation_token_expires_at)->toBeNull();
    $response->assertJsonPath('invitation_token_expires_at', null);
});

test('owner can generate invitation token without specifying expiry defaults to no expiry', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token");

    $response->assertOk();

    $trip->refresh();
    expect($trip->invitation_token_expires_at)->toBeNull();
});

test('expires_in validates allowed values', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'expires_in' => 'invalid_value',
        ]);

    $response->assertUnprocessable();
});

// ─── Revoke Invitation Token ──────────────────────────────────────────────────

test('owner can revoke invitation token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $trip->generateInvitationToken();

    expect($trip->fresh()->invitation_token)->not->toBeNull();

    $response = $this
        ->actingAs($user)
        ->deleteJson("/trips/{$trip->id}/revoke-invitation-token");

    $response->assertOk();
    $response->assertJsonPath('message', 'Invitation link revoked successfully');

    $trip->refresh();
    expect($trip->invitation_token)->toBeNull();
    expect($trip->invitation_token_expires_at)->toBeNull();
});

test('non-owner cannot revoke invitation token', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $trip->generateInvitationToken();

    $response = $this
        ->actingAs($other)
        ->deleteJson("/trips/{$trip->id}/revoke-invitation-token");

    $response->assertForbidden();
});

test('unauthenticated user cannot revoke invitation token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $trip->generateInvitationToken();

    $response = $this->deleteJson("/trips/{$trip->id}/revoke-invitation-token");

    $response->assertUnauthorized();
});

// ─── Expired Token: Preview ───────────────────────────────────────────────────

test('expired invitation token shows invitation-invalid page on preview', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $token = $trip->generateInvitationToken(now()->subMinute());

    $response = $this
        ->actingAs($viewer)
        ->get("/trips/preview/{$token}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('trips/invitation-invalid')
        ->where('reason', 'expired')
    );
});

test('valid not yet expired invitation token shows preview page', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $token = $trip->generateInvitationToken(now()->addDays(7));

    $response = $this
        ->actingAs($viewer)
        ->get("/trips/preview/{$token}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('trips/preview')
    );
});

test('invitation token with no expiry shows preview page', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $token = $trip->generateInvitationToken();

    $response = $this
        ->actingAs($viewer)
        ->get("/trips/preview/{$token}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('trips/preview')
    );
});

// ─── Expired Token: Join ──────────────────────────────────────────────────────

test('user cannot join trip with expired invitation token', function () {
    $owner = User::factory()->create();
    $joiner = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $token = $trip->generateInvitationToken(now()->subMinute());

    $response = $this
        ->actingAs($joiner)
        ->postJson("/trips/preview/{$token}/join");

    $response->assertStatus(410);
    $response->assertJson(['error' => 'This invitation link has expired']);

    $this->assertDatabaseMissing('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $joiner->id,
    ]);
});

test('existing collaborators are not affected when token is revoked', function () {
    $owner = User::factory()->create();
    $collaborator = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $trip->generateInvitationToken();

    $trip->sharedUsers()->attach($collaborator->id, ['collaboration_role' => 'editor']);

    $this
        ->actingAs($owner)
        ->deleteJson("/trips/{$trip->id}/revoke-invitation-token")
        ->assertOk();

    $this->assertDatabaseHas('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $collaborator->id,
        'collaboration_role' => 'editor',
    ]);
});

// ─── Model Unit Tests ─────────────────────────────────────────────────────────

test('Trip isInvitationTokenExpired returns false when no expiry set', function () {
    $trip = Trip::factory()->create(['invitation_token_expires_at' => null]);

    expect($trip->isInvitationTokenExpired())->toBeFalse();
});

test('Trip isInvitationTokenExpired returns true when expiry is in the past', function () {
    $trip = Trip::factory()->create([
        'invitation_token_expires_at' => now()->subDay(),
    ]);

    expect($trip->isInvitationTokenExpired())->toBeTrue();
});

test('Trip isInvitationTokenExpired returns false when expiry is in the future', function () {
    $trip = Trip::factory()->create([
        'invitation_token_expires_at' => now()->addDay(),
    ]);

    expect($trip->isInvitationTokenExpired())->toBeFalse();
});

test('Trip revokeInvitationToken clears token and expiry', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);
    $trip->generateInvitationToken(now()->addDays(7));

    expect($trip->fresh()->invitation_token)->not->toBeNull();
    expect($trip->fresh()->invitation_token_expires_at)->not->toBeNull();

    $trip->revokeInvitationToken();

    $trip->refresh();
    expect($trip->invitation_token)->toBeNull();
    expect($trip->invitation_token_expires_at)->toBeNull();
});

// ─── Revoked Token: Preview & Join ───────────────────────────────────────────

test('revoked invitation token shows invitation-invalid page with reason revoked on preview', function () {
    $owner = User::factory()->create();
    $viewer = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $token = $trip->generateInvitationToken();

    // Revoke the token
    $this->actingAs($owner)->deleteJson("/trips/{$trip->id}/revoke-invitation-token")->assertOk();

    $response = $this
        ->actingAs($viewer)
        ->get("/trips/preview/{$token}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('trips/invitation-invalid')
        ->where('reason', 'revoked')
    );
});

test('user cannot join trip with revoked invitation token', function () {
    $owner = User::factory()->create();
    $joiner = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $token = $trip->generateInvitationToken();

    // Revoke the token
    $this->actingAs($owner)->deleteJson("/trips/{$trip->id}/revoke-invitation-token")->assertOk();

    $response = $this
        ->actingAs($joiner)
        ->postJson("/trips/preview/{$token}/join");

    $response->assertStatus(410);
    $response->assertJson(['error' => 'This invitation link has been revoked']);

    $this->assertDatabaseMissing('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $joiner->id,
    ]);
});

// ─── Role Selection ───────────────────────────────────────────────────────────

test('owner can set join role when generating invitation token', function () {
    $user = User::factory()->create();
    $trip = Trip::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->postJson("/trips/{$trip->id}/generate-invitation-token", [
            'invitation_role' => 'viewer',
        ]);

    $response->assertOk();
    $response->assertJsonPath('invitation_role', 'viewer');

    $trip->refresh();
    expect($trip->invitation_role)->toBe('viewer');
});

test('joining user receives the configured invitation role', function () {
    $owner = User::factory()->create();
    $joiner = User::factory()->create();
    $trip = Trip::factory()->create([
        'user_id' => $owner->id,
        'invitation_role' => 'viewer',
        'invitation_token' => 'viewer-role-token',
    ]);

    $this
        ->actingAs($joiner)
        ->postJson('/trips/preview/viewer-role-token/join')
        ->assertOk();

    $this->assertDatabaseHas('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $joiner->id,
        'collaboration_role' => 'viewer',
    ]);
});
