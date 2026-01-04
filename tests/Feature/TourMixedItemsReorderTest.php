<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->tour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => null,
    ]);
});

it('can reorder mixed markers and sub-tours in a tour', function () {
    // Create markers
    $marker1 = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);
    $marker2 = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);
    $marker3 = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);

    // Create sub-tours
    $subTour1 = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 0,
    ]);
    $subTour2 = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 1,
    ]);

    // Attach markers to tour
    $this->tour->markers()->attach($marker1->id, ['position' => 0]);
    $this->tour->markers()->attach($marker2->id, ['position' => 1]);
    $this->tour->markers()->attach($marker3->id, ['position' => 2]);

    // Reorder: marker1, subtour1, marker2, subtour2, marker3
    $items = [
        ['type' => 'marker', 'id' => $marker1->id],
        ['type' => 'subtour', 'id' => $subTour1->id],
        ['type' => 'marker', 'id' => $marker2->id],
        ['type' => 'subtour', 'id' => $subTour2->id],
        ['type' => 'marker', 'id' => $marker3->id],
    ];

    $response = actingAs($this->user)->putJson("/tours/{$this->tour->id}/items/reorder", [
        'items' => $items,
    ]);

    $response->assertSuccessful();

    // Verify marker positions (indices in the combined list)
    expect($this->tour->markers()->find($marker1->id)->pivot->position)->toBe(0);
    expect($this->tour->markers()->find($marker2->id)->pivot->position)->toBe(2);
    expect($this->tour->markers()->find($marker3->id)->pivot->position)->toBe(4);

    // Verify sub-tour positions (indices in the combined list)
    expect($subTour1->fresh()->position)->toBe(1);
    expect($subTour2->fresh()->position)->toBe(3);
});

it('validates that markers belong to the tour when reordering items', function () {
    $marker1 = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);
    $marker2 = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);

    // Only attach marker1 to tour
    $this->tour->markers()->attach($marker1->id, ['position' => 0]);

    $items = [
        ['type' => 'marker', 'id' => $marker1->id],
        ['type' => 'marker', 'id' => $marker2->id], // This marker is not in the tour
    ];

    $response = actingAs($this->user)->putJson("/tours/{$this->tour->id}/items/reorder", [
        'items' => $items,
    ]);

    $response->assertStatus(422);
    $response->assertJson(['error' => 'One or more markers do not belong to this tour']);
});

it('validates that sub-tours belong to the tour when reordering items', function () {
    $subTour1 = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 0,
    ]);

    // Create another tour with its own sub-tour
    $anotherTour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
    ]);
    $anotherSubTour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $anotherTour->id,
        'position' => 0,
    ]);

    $items = [
        ['type' => 'subtour', 'id' => $subTour1->id],
        ['type' => 'subtour', 'id' => $anotherSubTour->id], // This belongs to another tour
    ];

    $response = actingAs($this->user)->putJson("/tours/{$this->tour->id}/items/reorder", [
        'items' => $items,
    ]);

    $response->assertStatus(422);
    $response->assertJson(['error' => 'One or more sub-tours do not belong to this tour']);
});

it('can reorder only markers in a tour', function () {
    $marker1 = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);
    $marker2 = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);

    $this->tour->markers()->attach($marker1->id, ['position' => 0]);
    $this->tour->markers()->attach($marker2->id, ['position' => 1]);

    $items = [
        ['type' => 'marker', 'id' => $marker2->id],
        ['type' => 'marker', 'id' => $marker1->id],
    ];

    $response = actingAs($this->user)->putJson("/tours/{$this->tour->id}/items/reorder", [
        'items' => $items,
    ]);

    $response->assertSuccessful();

    expect($this->tour->markers()->find($marker2->id)->pivot->position)->toBe(0);
    expect($this->tour->markers()->find($marker1->id)->pivot->position)->toBe(1);
});

it('can reorder only sub-tours in a tour', function () {
    $subTour1 = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 0,
    ]);
    $subTour2 = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 1,
    ]);

    $items = [
        ['type' => 'subtour', 'id' => $subTour2->id],
        ['type' => 'subtour', 'id' => $subTour1->id],
    ];

    $response = actingAs($this->user)->putJson("/tours/{$this->tour->id}/items/reorder", [
        'items' => $items,
    ]);

    $response->assertSuccessful();

    expect($subTour2->fresh()->position)->toBe(0);
    expect($subTour1->fresh()->position)->toBe(1);
});

it('requires authorization to reorder items', function () {
    $otherUser = User::factory()->create();

    $items = [
        ['type' => 'marker', 'id' => 'some-id'],
    ];

    $response = actingAs($otherUser)->putJson("/tours/{$this->tour->id}/items/reorder", [
        'items' => $items,
    ]);

    $response->assertForbidden();
});

it('requires items array when reordering', function () {
    $response = actingAs($this->user)->putJson("/tours/{$this->tour->id}/items/reorder", []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('items');
});

it('validates item type when reordering', function () {
    $marker = Marker::factory()->create(['trip_id' => $this->trip->id, 'user_id' => $this->user->id]);
    $this->tour->markers()->attach($marker->id, ['position' => 0]);

    $items = [
        ['type' => 'invalid', 'id' => $marker->id],
    ];

    $response = actingAs($this->user)->putJson("/tours/{$this->tour->id}/items/reorder", [
        'items' => $items,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('items.0.type');
});
