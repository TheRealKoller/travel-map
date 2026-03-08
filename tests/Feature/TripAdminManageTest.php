<?php

use App\Models\Trip;
use App\Models\User;
use App\Services\TripService;
use Illuminate\Auth\Access\AuthorizationException;

beforeEach(function () {
    $this->admin = User::factory()->admin()->withoutTwoFactor()->create();
    $this->owner = User::factory()->withoutTwoFactor()->create();
    $this->tripService = new TripService;
});

// --- Map route ---

test('admin can access map for another users trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->admin)->get("/map/{$trip->id}");

    $response->assertStatus(200);
});

test('map route passes owner prop when admin views another users trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->admin)->get("/map/{$trip->id}");

    $response->assertInertia(fn ($page) => $page
        ->component('map')
        ->has('owner')
        ->where('owner.id', $this->owner->id)
        ->where('owner.name', $this->owner->name)
    );
});

test('map route does not pass owner prop when admin views own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->admin->id]);

    $response = $this->actingAs($this->admin)->get("/map/{$trip->id}");

    $response->assertInertia(fn ($page) => $page
        ->component('map')
        ->missing('owner')
    );
});

test('regular user still cannot access map for another users trip', function () {
    $otherUser = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($otherUser)->get("/map/{$trip->id}");

    $response->assertForbidden();
});

// --- TripController::edit ---

test('admin can access edit page for another users trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->admin)->get("/trips/{$trip->id}/edit");

    $response->assertStatus(200);
});

test('edit page passes owner prop when admin edits another users trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $response = $this->actingAs($this->admin)->get("/trips/{$trip->id}/edit");

    $response->assertInertia(fn ($page) => $page
        ->component('trips/create')
        ->has('owner')
        ->where('owner.id', $this->owner->id)
        ->where('owner.name', $this->owner->name)
    );
});

test('edit page does not pass owner prop when admin edits own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->admin->id]);

    $response = $this->actingAs($this->admin)->get("/trips/{$trip->id}/edit");

    $response->assertInertia(fn ($page) => $page
        ->component('trips/create')
        ->missing('owner')
    );
});

// --- TripCollaboratorController ---

test('admin can add collaborator to another users trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $collaborator = User::factory()->withoutTwoFactor()->create();

    $response = $this->actingAs($this->admin)->postJson("/trips/{$trip->id}/collaborators", [
        'email' => $collaborator->email,
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['email' => $collaborator->email]);

    $this->assertDatabaseHas('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $collaborator->id,
    ]);
});

test('admin can remove collaborator from another users trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $collaborator = User::factory()->withoutTwoFactor()->create();
    $trip->sharedUsers()->attach($collaborator->id, ['collaboration_role' => 'editor']);

    $response = $this->actingAs($this->admin)->deleteJson("/trips/{$trip->id}/collaborators/{$collaborator->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('trip_user', [
        'trip_id' => $trip->id,
        'user_id' => $collaborator->id,
    ]);
});

// --- TripService::getActiveTrip ---

test('getActiveTrip returns any trip for admin regardless of ownership', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $result = $this->tripService->getActiveTrip($this->admin, $trip->id);

    expect($result->id)->toBe($trip->id);
});

test('getActiveTrip falls back to default for admin when no tripId given', function () {
    $result = $this->tripService->getActiveTrip($this->admin);

    expect($result->name)->toBe('Default');
});

// --- TripService::findTripForUser ---

test('findTripForUser returns any trip for admin regardless of ownership', function () {
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $result = $this->tripService->findTripForUser($this->admin, $trip->id);

    expect($result->id)->toBe($trip->id);
});

test('findTripForUser still throws AuthorizationException for non-admin accessing other users trip', function () {
    $otherUser = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $this->owner->id]);

    $this->tripService->findTripForUser($otherUser, $trip->id);
})->throws(AuthorizationException::class);
