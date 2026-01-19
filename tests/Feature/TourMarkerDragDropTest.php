<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('marker can be attached to tour multiple times', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Attach marker first time
    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $tour->id,
    ]);

    // Attach the same marker again - should be allowed
    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    // Should return 200 and create a duplicate entry
    $response->assertStatus(200);

    // Verify there are now two entries in the pivot table
    $count = \DB::table('marker_tour')
        ->where('marker_id', $marker->id)
        ->where('tour_id', $tour->id)
        ->count();

    expect($count)->toBe(2);
});

test('marker from different trip cannot be attached to tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    // Create another trip and marker
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $otherMarker = Marker::factory()->create([
        'trip_id' => $otherTrip->id,
        'user_id' => $this->user->id,
    ]);

    // Try to attach marker from different trip
    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $otherMarker->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['error' => 'Marker does not belong to this tour\'s trip']);

    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $otherMarker->id,
        'tour_id' => $tour->id,
    ]);
});

test('tour includes markers relationship in response', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker 1',
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker 2',
    ]);

    // Attach both markers to tour
    $tour->markers()->attach([$marker1->id, $marker2->id]);

    // Fetch tour
    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'id',
            'name',
            'trip_id',
            'markers' => [
                '*' => [
                    'id',
                    'name',
                    'latitude',
                    'longitude',
                    'type',
                ],
            ],
        ])
        ->assertJsonFragment(['name' => 'Marker 1'])
        ->assertJsonFragment(['name' => 'Marker 2']);

    $markers = $response->json('markers');
    expect($markers)->toHaveCount(2);
});

test('detaching marker from tour works correctly', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Attach marker
    $tour->markers()->attach($marker->id);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $tour->id,
    ]);

    // Detach marker
    $response = $this->actingAs($this->user)->deleteJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $tour->id,
    ]);
});

test('tour list includes markers for each tour', function () {
    $tour1 = Tour::factory()->create(['trip_id' => $this->trip->id, 'name' => 'Tour 1']);
    $tour2 = Tour::factory()->create(['trip_id' => $this->trip->id, 'name' => 'Tour 2']);

    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Attach marker1 to tour1
    $tour1->markers()->attach($marker1->id);

    // Attach marker2 to tour2
    $tour2->markers()->attach($marker2->id);

    // Fetch tours list
    $response = $this->actingAs($this->user)->getJson("/tours?trip_id={$this->trip->id}");

    $response->assertStatus(200)
        ->assertJsonStructure([
            '*' => [
                'id',
                'name',
                'markers',
            ],
        ]);

    $tours = $response->json();
    expect($tours)->toHaveCount(2);

    // Check tour1 has 1 marker
    $tour1Data = collect($tours)->firstWhere('name', 'Tour 1');
    expect($tour1Data['markers'])->toHaveCount(1);

    // Check tour2 has 1 marker
    $tour2Data = collect($tours)->firstWhere('name', 'Tour 2');
    expect($tour2Data['markers'])->toHaveCount(1);
});
