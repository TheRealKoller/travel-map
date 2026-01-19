<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
});

test('markers are attached with position', function () {
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Attach first marker
    $this->actingAs($this->user)->postJson("/tours/{$this->tour->id}/markers", [
        'marker_id' => $marker1->id,
    ]);

    // Attach second marker
    $this->actingAs($this->user)->postJson("/tours/{$this->tour->id}/markers", [
        'marker_id' => $marker2->id,
    ]);

    // Verify positions
    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker1->id,
        'tour_id' => $this->tour->id,
        'position' => 0,
    ]);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker2->id,
        'tour_id' => $this->tour->id,
        'position' => 1,
    ]);
});

test('markers can be reordered in a tour', function () {
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker3 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Attach markers
    $this->tour->markers()->attach($marker1->id, ['position' => 0]);
    $this->tour->markers()->attach($marker2->id, ['position' => 1]);
    $this->tour->markers()->attach($marker3->id, ['position' => 2]);

    // Reorder: move marker1 to the end
    $response = $this->actingAs($this->user)->putJson(
        "/tours/{$this->tour->id}/markers/reorder",
        [
            'marker_ids' => [
                $marker2->id,
                $marker3->id,
                $marker1->id,
            ],
        ]
    );

    $response->assertStatus(200);

    // Verify new positions
    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker2->id,
        'tour_id' => $this->tour->id,
        'position' => 0,
    ]);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker3->id,
        'tour_id' => $this->tour->id,
        'position' => 1,
    ]);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker1->id,
        'tour_id' => $this->tour->id,
        'position' => 2,
    ]);
});

test('markers are returned in correct order', function () {
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'First Marker',
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Second Marker',
    ]);
    $marker3 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Third Marker',
    ]);

    // Attach markers with specific positions
    $this->tour->markers()->attach($marker1->id, ['position' => 0]);
    $this->tour->markers()->attach($marker2->id, ['position' => 1]);
    $this->tour->markers()->attach($marker3->id, ['position' => 2]);

    // Get tour with markers
    $response = $this->actingAs($this->user)->getJson("/tours/{$this->tour->id}");

    $response->assertStatus(200);

    $markers = $response->json('markers');
    expect($markers)->toHaveCount(3);
    expect($markers[0]['name'])->toBe('First Marker');
    expect($markers[1]['name'])->toBe('Second Marker');
    expect($markers[2]['name'])->toBe('Third Marker');
});

test('reorder endpoint requires marker_ids array', function () {
    $response = $this->actingAs($this->user)->putJson(
        "/tours/{$this->tour->id}/markers/reorder",
        []
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['marker_ids']);
});

test('reorder endpoint validates marker IDs exist', function () {
    $response = $this->actingAs($this->user)->putJson(
        "/tours/{$this->tour->id}/markers/reorder",
        [
            'marker_ids' => [
                '00000000-0000-0000-0000-000000000000',
            ],
        ]
    );

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['marker_ids.0']);
});

test('user cannot reorder markers in another users tour', function () {
    $otherTrip = Trip::factory()->create();
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $otherTrip->id,
        'user_id' => $otherTrip->user_id,
    ]);

    $otherTour->markers()->attach($marker->id, ['position' => 0]);

    $response = $this->actingAs($this->user)->putJson(
        "/tours/{$otherTour->id}/markers/reorder",
        [
            'marker_ids' => [$marker->id],
        ]
    );

    $response->assertStatus(403);
});

test('reorder endpoint accepts any markers from same trip', function () {
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Only attach marker1 to tour
    $this->tour->markers()->attach($marker1->id, ['position' => 0]);

    // Reorder with marker2 (which is not in the tour yet)
    // This should work and add marker2 to the tour
    $response = $this->actingAs($this->user)->putJson(
        "/tours/{$this->tour->id}/markers/reorder",
        [
            'marker_ids' => [$marker1->id, $marker2->id],
        ]
    );

    $response->assertStatus(200);

    // Verify both markers are now in the tour with correct positions
    $this->tour->refresh();
    expect($this->tour->markers)->toHaveCount(2);
    expect($this->tour->markers[0]->id)->toBe($marker1->id);
    expect($this->tour->markers[1]->id)->toBe($marker2->id);
});
