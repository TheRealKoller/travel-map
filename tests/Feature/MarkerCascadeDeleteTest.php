<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Trip;
use App\Models\User;

uses()->group('markers', 'cascade-delete');

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->marker1 = Marker::factory()->create(['trip_id' => $this->trip->id]);
    $this->marker2 = Marker::factory()->create(['trip_id' => $this->trip->id]);
    $this->marker3 = Marker::factory()->create(['trip_id' => $this->trip->id]);
});

it('soft deletes routes when marker is soft deleted as start marker', function () {
    // Create a route where marker1 is the start
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker2->id,
    ]);

    // Delete the start marker
    $this->marker1->delete();

    // Route should be soft deleted due to cascade
    $this->assertSoftDeleted('routes', ['id' => $route->id]);
    $this->assertSoftDeleted('markers', ['id' => $this->marker1->id]);
});

it('soft deletes routes when marker is soft deleted as end marker', function () {
    // Create a route where marker1 is the end
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker2->id,
        'end_marker_id' => $this->marker1->id,
    ]);

    // Delete the end marker
    $this->marker1->delete();

    // Route should be soft deleted due to cascade
    $this->assertSoftDeleted('routes', ['id' => $route->id]);
    $this->assertSoftDeleted('markers', ['id' => $this->marker1->id]);
});

it('soft deletes multiple routes when marker is deleted', function () {
    // Create multiple routes using the same marker
    $route1 = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker2->id,
    ]);

    $route2 = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker3->id,
    ]);

    $route3 = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker3->id,
        'end_marker_id' => $this->marker1->id,
    ]);

    // Delete marker1
    $this->marker1->delete();

    // All routes should be soft deleted
    $this->assertSoftDeleted('routes', ['id' => $route1->id]);
    $this->assertSoftDeleted('routes', ['id' => $route2->id]);
    $this->assertSoftDeleted('routes', ['id' => $route3->id]);
    $this->assertSoftDeleted('markers', ['id' => $this->marker1->id]);
});

it('does not delete routes when other markers exist', function () {
    // Create routes between different markers
    $route1 = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker2->id,
    ]);

    $route2 = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker2->id,
        'end_marker_id' => $this->marker3->id,
    ]);

    // Delete marker1
    $this->marker1->delete();

    // Only route1 should be deleted, route2 should remain
    $this->assertSoftDeleted('routes', ['id' => $route1->id]);
    $this->assertDatabaseHas('routes', [
        'id' => $route2->id,
        'deleted_at' => null,
    ]);
});

it('returns route count when deleting marker via API', function () {
    // Create routes
    Route::factory()->count(2)->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker2->id,
    ]);

    Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker3->id,
        'end_marker_id' => $this->marker1->id,
    ]);

    $response = $this->deleteJson("/markers/{$this->marker1->id}");

    $response->assertOk()
        ->assertJson([
            'message' => 'Marker deleted successfully',
            'cascade_deleted_routes' => 3,
        ]);

    $this->assertSoftDeleted('markers', ['id' => $this->marker1->id]);
});

it('returns zero route count when deleting marker with no routes', function () {
    // No routes created for marker1

    $response = $this->deleteJson("/markers/{$this->marker1->id}");

    $response->assertOk()
        ->assertJson([
            'message' => 'Marker deleted successfully',
            'cascade_deleted_routes' => 0,
        ]);

    $this->assertSoftDeleted('markers', ['id' => $this->marker1->id]);
});

it('can get route count for a marker', function () {
    // Create routes
    Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker2->id,
    ]);

    Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker3->id,
        'end_marker_id' => $this->marker1->id,
    ]);

    $response = $this->getJson("/markers/{$this->marker1->id}/route-count");

    $response->assertOk()
        ->assertJson([
            'route_count' => 2,
        ]);
});

it('returns zero for route count when marker has no routes', function () {
    $response = $this->getJson("/markers/{$this->marker1->id}/route-count");

    $response->assertOk()
        ->assertJson([
            'route_count' => 0,
        ]);
});

it('cannot get route count for another users marker', function () {
    $otherUser = User::factory()->create();
    $otherTrip = Trip::factory()->create(['user_id' => $otherUser->id]);
    $otherMarker = Marker::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->getJson("/markers/{$otherMarker->id}/route-count");

    $response->assertForbidden();
});

it('permanently deletes routes when marker is force deleted', function () {
    // Create routes
    $route1 = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker2->id,
    ]);

    // Soft delete first
    $this->marker1->delete();
    $this->assertSoftDeleted('markers', ['id' => $this->marker1->id]);
    $this->assertSoftDeleted('routes', ['id' => $route1->id]);

    // Force delete
    $this->marker1->forceDelete();

    // Both should be permanently deleted
    $this->assertDatabaseMissing('markers', ['id' => $this->marker1->id]);
    $this->assertDatabaseMissing('routes', ['id' => $route1->id]);
});

it('has correct relationship methods on marker model', function () {
    // Create routes
    Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker1->id,
        'end_marker_id' => $this->marker2->id,
    ]);

    Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->marker3->id,
        'end_marker_id' => $this->marker1->id,
    ]);

    // Test relationship methods
    expect($this->marker1->routesAsStart()->count())->toBe(1);
    expect($this->marker1->routesAsEnd()->count())->toBe(1);
    expect($this->marker2->routesAsEnd()->count())->toBe(1);
    expect($this->marker2->routesAsStart()->count())->toBe(0);
});
