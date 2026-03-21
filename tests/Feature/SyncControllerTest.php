<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->owner = User::factory()->withoutTwoFactor()->create();
    $this->editor = User::factory()->withoutTwoFactor()->create();
    $this->viewer = User::factory()->withoutTwoFactor()->create();
    $this->outsider = User::factory()->withoutTwoFactor()->create();

    $this->trip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $this->trip->sharedUsers()->attach($this->editor->id, ['collaboration_role' => 'editor']);
    $this->trip->sharedUsers()->attach($this->viewer->id, ['collaboration_role' => 'viewer']);
});

test('sync endpoint requires authentication', function () {
    $since = now()->subMinutes(5)->toIso8601String();

    $response = $this->getJson("/trips/{$this->trip->id}/sync?since={$since}");

    $response->assertUnauthorized();
});

test('owner can access sync endpoint', function () {
    $since = now()->subMinutes(5)->toIso8601String();

    $response = $this->actingAs($this->owner)->getJson("/trips/{$this->trip->id}/sync?since={$since}");

    $response->assertOk()
        ->assertJsonStructure([
            'markers',
            'routes',
            'tours',
            'deleted_marker_ids',
            'deleted_route_ids',
            'deleted_tour_ids',
        ]);
});

test('editor can access sync endpoint', function () {
    $since = now()->subMinutes(5)->toIso8601String();

    $response = $this->actingAs($this->editor)->getJson("/trips/{$this->trip->id}/sync?since={$since}");

    $response->assertOk();
});

test('viewer can access sync endpoint', function () {
    $since = now()->subMinutes(5)->toIso8601String();

    $response = $this->actingAs($this->viewer)->getJson("/trips/{$this->trip->id}/sync?since={$since}");

    $response->assertOk();
});

test('outsider cannot access sync endpoint', function () {
    $since = now()->subMinutes(5)->toIso8601String();

    $response = $this->actingAs($this->outsider)->getJson("/trips/{$this->trip->id}/sync?since={$since}");

    $response->assertForbidden();
});

test('sync without since parameter returns empty arrays', function () {
    $response = $this->actingAs($this->owner)->getJson("/trips/{$this->trip->id}/sync");

    $response->assertOk()
        ->assertExactJson([
            'markers' => [],
            'routes' => [],
            'tours' => [],
            'deleted_marker_ids' => [],
            'deleted_route_ids' => [],
            'deleted_tour_ids' => [],
        ]);
});

test('sync with invalid since parameter returns 422', function () {
    $response = $this->actingAs($this->owner)->getJson("/trips/{$this->trip->id}/sync?since=not-a-date");

    $response->assertStatus(422);
});

test('sync returns markers updated after since timestamp', function () {
    $since = now()->subMinutes(10);

    // Marker updated BEFORE since - should NOT appear
    $oldMarker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->owner->id,
        'updated_at' => now()->subMinutes(15),
    ]);

    // Marker updated AFTER since - should appear
    $newMarker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->owner->id,
        'updated_at' => now()->subMinutes(2),
    ]);

    $response = $this->actingAs($this->owner)->getJson(
        "/trips/{$this->trip->id}/sync?since={$since->toIso8601String()}"
    );

    $response->assertOk();

    $markerIds = collect($response->json('markers'))->pluck('id')->toArray();
    expect($markerIds)->toContain($newMarker->id);
    expect($markerIds)->not->toContain($oldMarker->id);
});

test('sync returns tours updated after since timestamp', function () {
    $since = now()->subMinutes(10);

    $oldTour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'updated_at' => now()->subMinutes(15),
    ]);

    $newTour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'updated_at' => now()->subMinutes(2),
    ]);

    $response = $this->actingAs($this->owner)->getJson(
        "/trips/{$this->trip->id}/sync?since={$since->toIso8601String()}"
    );

    $response->assertOk();

    $tourIds = collect($response->json('tours'))->pluck('id')->toArray();
    expect($tourIds)->toContain($newTour->id);
    expect($tourIds)->not->toContain($oldTour->id);
});

test('sync returns deleted marker ids since timestamp', function () {
    $since = now()->subMinutes(10);

    $markerA = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->owner->id,
    ]);
    $markerB = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->owner->id,
    ]);

    // Delete markerA after the since timestamp
    $markerA->delete();

    // Manually set markerB's deleted_at to before the since timestamp (should NOT appear)
    $markerB->delete();
    $markerB->forceFill(['deleted_at' => now()->subMinutes(15)])->save();

    $response = $this->actingAs($this->owner)->getJson(
        "/trips/{$this->trip->id}/sync?since={$since->toIso8601String()}"
    );

    $response->assertOk();

    $deletedIds = $response->json('deleted_marker_ids');
    expect($deletedIds)->toContain($markerA->id);
    expect($deletedIds)->not->toContain($markerB->id);
});

test('sync returns deleted tour ids since timestamp', function () {
    $since = now()->subMinutes(10);

    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $tour->delete();

    $response = $this->actingAs($this->owner)->getJson(
        "/trips/{$this->trip->id}/sync?since={$since->toIso8601String()}"
    );

    $response->assertOk();

    $deletedIds = $response->json('deleted_tour_ids');
    expect($deletedIds)->toContain($tour->id);
});

test('sync does not return markers belonging to another trip', function () {
    $otherTrip = Trip::factory()->create(['user_id' => $this->owner->id]);
    $otherMarker = Marker::factory()->create([
        'trip_id' => $otherTrip->id,
        'user_id' => $this->owner->id,
        'updated_at' => now(),
    ]);

    $since = now()->subMinutes(5);

    $response = $this->actingAs($this->owner)->getJson(
        "/trips/{$this->trip->id}/sync?since={$since->toIso8601String()}"
    );

    $response->assertOk();

    $markerIds = collect($response->json('markers'))->pluck('id')->toArray();
    expect($markerIds)->not->toContain($otherMarker->id);
});

test('trip index returns shared_users_count', function () {
    $response = $this->actingAs($this->owner)->getJson('/trips');

    $response->assertOk();

    $trip = collect($response->json())->firstWhere('id', $this->trip->id);
    expect($trip)->toHaveKey('shared_users_count');
    expect($trip['shared_users_count'])->toBe(2); // editor + viewer
});
