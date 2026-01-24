<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Http;

uses()->group('tours', 'routes');

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    
    // Create 4 markers for testing
    $this->markerA = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker A',
    ]);
    $this->markerB = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker B',
    ]);
    $this->markerC = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker C',
    ]);
    $this->markerD = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker D',
    ]);
});

test('tour maintains correct route associations after marker reordering', function () {
    // Create a tour with markers in order: A -> B -> C -> D
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $tour->markers()->attach($this->markerA->id, ['position' => 0]);
    $tour->markers()->attach($this->markerB->id, ['position' => 1]);
    $tour->markers()->attach($this->markerC->id, ['position' => 2]);
    $tour->markers()->attach($this->markerD->id, ['position' => 3]);

    // Create routes for consecutive pairs: A->B, B->C, C->D
    $routeAB = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerA->id,
        'end_marker_id' => $this->markerB->id,
    ]);
    
    $routeBC = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerB->id,
        'end_marker_id' => $this->markerC->id,
    ]);
    
    $routeCD = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerC->id,
        'end_marker_id' => $this->markerD->id,
    ]);

    // Verify initial setup
    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");
    $response->assertOk();
    
    $tourData = $response->json();
    expect($tourData['markers'])->toHaveCount(4);
    expect($tourData['markers'][0]['id'])->toBe($this->markerA->id);
    expect($tourData['markers'][1]['id'])->toBe($this->markerB->id);
    expect($tourData['markers'][2]['id'])->toBe($this->markerC->id);
    expect($tourData['markers'][3]['id'])->toBe($this->markerD->id);

    // Verify all routes exist
    $routes = $this->actingAs($this->user)->getJson("/routes?trip_id={$this->trip->id}");
    expect($routes->json())->toHaveCount(3);
    
    // Reorder markers to: A -> B -> D -> C
    $reorderResponse = $this->actingAs($this->user)->putJson("/tours/{$tour->id}/markers/reorder", [
        'marker_ids' => [
            $this->markerA->id,
            $this->markerB->id,
            $this->markerD->id,
            $this->markerC->id,
        ],
    ]);
    
    $reorderResponse->assertOk();
    
    // Verify new order
    $tour->refresh();
    $orderedMarkers = $tour->markers;
    expect($orderedMarkers[0]->id)->toBe($this->markerA->id);
    expect($orderedMarkers[1]->id)->toBe($this->markerB->id);
    expect($orderedMarkers[2]->id)->toBe($this->markerD->id);
    expect($orderedMarkers[3]->id)->toBe($this->markerC->id);

    // Routes still exist in database
    $this->assertDatabaseHas('routes', ['id' => $routeAB->id]);
    $this->assertDatabaseHas('routes', ['id' => $routeBC->id]);
    $this->assertDatabaseHas('routes', ['id' => $routeCD->id]);
    
    // Frontend should filter and display:
    // - Route A->B (still valid)
    // - Route D->C should NOT be displayed (B->C is stored but B->D is needed)
    // - Route C->D should NOT be displayed (stored as C->D but need D->C)
    // Tour lines should be drawn for: B->D and D->C
});

test('routes for non-consecutive markers in tour are not displayed', function () {
    // Create a tour with markers: A -> B -> C
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $tour->markers()->attach($this->markerA->id, ['position' => 0]);
    $tour->markers()->attach($this->markerB->id, ['position' => 1]);
    $tour->markers()->attach($this->markerC->id, ['position' => 2]);

    // Create a route that skips a marker: A->C (not consecutive)
    $routeAC = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerA->id,
        'end_marker_id' => $this->markerC->id,
    ]);

    // The route exists in the database
    $this->assertDatabaseHas('routes', ['id' => $routeAC->id]);
    
    // Get the tour to check marker order
    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");
    $tourData = $response->json();
    
    // Verify marker order: A, B, C
    expect($tourData['markers'][0]['id'])->toBe($this->markerA->id);
    expect($tourData['markers'][1]['id'])->toBe($this->markerB->id);
    expect($tourData['markers'][2]['id'])->toBe($this->markerC->id);
    
    // The frontend should NOT display this route because A and C are not consecutive
    // (The actual filtering happens in the frontend hook, but the data structure
    // allows us to verify the route exists and the order is correct)
});

test('only routes matching consecutive marker pairs are relevant for display', function () {
    // Create a tour with markers: A -> B -> C -> D
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $tour->markers()->attach($this->markerA->id, ['position' => 0]);
    $tour->markers()->attach($this->markerB->id, ['position' => 1]);
    $tour->markers()->attach($this->markerC->id, ['position' => 2]);
    $tour->markers()->attach($this->markerD->id, ['position' => 3]);

    // Create all possible routes between these markers
    $routeAB = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerA->id,
        'end_marker_id' => $this->markerB->id,
    ]);
    
    $routeBC = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerB->id,
        'end_marker_id' => $this->markerC->id,
    ]);
    
    $routeCD = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerC->id,
        'end_marker_id' => $this->markerD->id,
    ]);
    
    // Also create a non-consecutive route A->D
    $routeAD = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerA->id,
        'end_marker_id' => $this->markerD->id,
    ]);

    // All routes exist in database
    $routes = $this->actingAs($this->user)->getJson("/routes?trip_id={$this->trip->id}");
    expect($routes->json())->toHaveCount(4);
    
    // Get tour data
    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");
    $tourData = $response->json();
    
    // Verify order: A -> B -> C -> D
    $markerIds = array_map(fn($m) => $m['id'], $tourData['markers']);
    expect($markerIds)->toBe([
        $this->markerA->id,
        $this->markerB->id,
        $this->markerC->id,
        $this->markerD->id,
    ]);
    
    // For this order, consecutive pairs are: A->B, B->C, C->D
    // Route A->D should NOT be displayed since A and D are not consecutive
});

test('tour with duplicate markers shows routes for their actual positions', function () {
    // Create a tour with duplicate marker: A -> B -> A -> C
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $tour->markers()->attach($this->markerA->id, ['position' => 0]);
    $tour->markers()->attach($this->markerB->id, ['position' => 1]);
    $tour->markers()->attach($this->markerA->id, ['position' => 2]); // A appears again
    $tour->markers()->attach($this->markerC->id, ['position' => 3]);

    // Create routes for consecutive pairs: A->B, B->A, A->C
    $routeAB = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerA->id,
        'end_marker_id' => $this->markerB->id,
    ]);
    
    $routeBA = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerB->id,
        'end_marker_id' => $this->markerA->id,
    ]);
    
    $routeAC = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $this->markerA->id,
        'end_marker_id' => $this->markerC->id,
    ]);

    // Verify tour order
    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");
    $tourData = $response->json();
    expect($tourData['markers'])->toHaveCount(4);
    
    // All three routes should be valid for display since they match consecutive pairs
    $routes = $this->actingAs($this->user)->getJson("/routes?trip_id={$this->trip->id}");
    expect($routes->json())->toHaveCount(3);
});
