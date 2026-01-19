<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
});

test('authenticated user can list tours for their trip', function () {
    Tour::factory()->count(3)->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->getJson("/tours?trip_id={$this->trip->id}");

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

test('authenticated user can create a tour', function () {
    $tourData = [
        'name' => 'Day 1 - Tokyo',
        'trip_id' => $this->trip->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/tours', $tourData);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Day 1 - Tokyo']);

    $this->assertDatabaseHas('tours', [
        'name' => 'Day 1 - Tokyo',
        'trip_id' => $this->trip->id,
    ]);
});

test('tour name is required when creating', function () {
    $response = $this->actingAs($this->user)->postJson('/tours', [
        'trip_id' => $this->trip->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('trip_id is required when creating a tour', function () {
    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'Day 1',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['trip_id']);
});

test('authenticated user can view their own tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => $tour->name]);
});

test('user cannot view another users tour', function () {
    $otherTrip = Trip::factory()->create();
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->actingAs($this->user)->getJson("/tours/{$otherTour->id}");

    $response->assertStatus(403);
});

test('authenticated user can update their own tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$tour->id}", [
        'name' => 'Updated Tour Name',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Tour Name']);

    $this->assertDatabaseHas('tours', [
        'id' => $tour->id,
        'name' => 'Updated Tour Name',
    ]);
});

test('user cannot update another users tour', function () {
    $otherTrip = Trip::factory()->create();
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$otherTour->id}", [
        'name' => 'Hacked Name',
    ]);

    $response->assertStatus(403);
});

test('authenticated user can delete their own tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$tour->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('tours', ['id' => $tour->id]);
});

test('deleting a tour keeps markers associated with trip', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$tour->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('tours', ['id' => $tour->id]);
    $this->assertDatabaseMissing('marker_tour', ['tour_id' => $tour->id]);
    $this->assertDatabaseHas('markers', ['id' => $marker1->id, 'trip_id' => $this->trip->id]);
    $this->assertDatabaseHas('markers', ['id' => $marker2->id, 'trip_id' => $this->trip->id]);
});

test('user cannot delete another users tour', function () {
    $otherTrip = Trip::factory()->create();
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$otherTour->id}");

    $response->assertStatus(403);
});

test('authenticated user can attach marker to tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $tour->id,
    ]);
});

test('user cannot attach marker from different trip to tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $otherTrip->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(422);
});

test('authenticated user can detach marker from tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $tour->markers()->attach($marker->id);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $tour->id,
    ]);
});

test('unauthenticated user cannot access tour endpoints', function () {
    $this->getJson('/tours?trip_id=1')->assertStatus(401);
    $this->postJson('/tours', ['name' => 'Test', 'trip_id' => 1])->assertStatus(401);
    $this->getJson('/tours/1')->assertStatus(401);
    $this->putJson('/tours/1', ['name' => 'Test'])->assertStatus(401);
    $this->deleteJson('/tours/1')->assertStatus(401);
});

test('tour name must be unique per trip (case-insensitive)', function () {
    Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 1 - Tokyo',
    ]);

    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'day 1 - tokyo',
        'trip_id' => $this->trip->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('tour name can be the same in different trips', function () {
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);

    Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 1 - Tokyo',
    ]);

    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'Day 1 - Tokyo',
        'trip_id' => $otherTrip->id,
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Day 1 - Tokyo']);
});

test('tour name uniqueness check handles uppercase', function () {
    Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 1 - Tokyo',
    ]);

    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'DAY 1 - TOKYO',
        'trip_id' => $this->trip->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('tour name uniqueness check handles mixed case', function () {
    Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 1 - Tokyo',
    ]);

    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'dAy 1 - tOkYo',
        'trip_id' => $this->trip->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('updating tour name must be unique per trip (case-insensitive)', function () {
    $tour1 = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 1 - Tokyo',
    ]);

    $tour2 = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 2 - Osaka',
    ]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$tour2->id}", [
        'name' => 'day 1 - tokyo',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('updating tour to same name is allowed', function () {
    $tour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 1 - Tokyo',
    ]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$tour->id}", [
        'name' => 'Day 1 - Tokyo',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Day 1 - Tokyo']);
});

test('updating tour to same name with different case is allowed', function () {
    $tour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'name' => 'Day 1 - Tokyo',
    ]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$tour->id}", [
        'name' => 'DAY 1 - TOKYO',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'DAY 1 - TOKYO']);
});

test('marker can be added multiple times to same tour', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Add marker first time
    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);
    $response->assertStatus(200);

    // Add same marker second time
    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);
    $response->assertStatus(200);

    // Add same marker third time
    $response = $this->actingAs($this->user)->postJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);
    $response->assertStatus(200);

    // Verify all three instances exist in database
    $this->assertDatabaseCount('marker_tour', 3);

    $markerTourRecords = DB::table('marker_tour')
        ->where('marker_id', $marker->id)
        ->where('tour_id', $tour->id)
        ->get();

    expect($markerTourRecords)->toHaveCount(3);
});

test('detaching marker removes only one instance when duplicates exist', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Add marker three times
    $tour->markers()->attach($marker->id, ['position' => 0]);
    $tour->markers()->attach($marker->id, ['position' => 1]);
    $tour->markers()->attach($marker->id, ['position' => 2]);

    // Verify three instances exist
    $this->assertDatabaseCount('marker_tour', 3);

    // Detach one instance
    $response = $this->actingAs($this->user)->deleteJson("/tours/{$tour->id}/markers", [
        'marker_id' => $marker->id,
    ]);
    $response->assertStatus(200);

    // Verify only two instances remain
    $markerTourRecords = DB::table('marker_tour')
        ->where('marker_id', $marker->id)
        ->where('tour_id', $tour->id)
        ->get();

    expect($markerTourRecords)->toHaveCount(2);
});

test('reorder markers works with duplicate markers', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $marker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Add markers in order: marker1, marker2, marker1, marker2
    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);
    $tour->markers()->attach($marker1->id, ['position' => 2]);
    $tour->markers()->attach($marker2->id, ['position' => 3]);

    // Reorder to: marker2, marker1, marker2, marker1
    $response = $this->actingAs($this->user)->putJson("/tours/{$tour->id}/markers/reorder", [
        'marker_ids' => [$marker2->id, $marker1->id, $marker2->id, $marker1->id],
    ]);

    $response->assertStatus(200);

    // Verify the new order
    $tour->refresh();
    $orderedMarkers = $tour->markers;

    expect($orderedMarkers[0]->id)->toBe($marker2->id);
    expect($orderedMarkers[1]->id)->toBe($marker1->id);
    expect($orderedMarkers[2]->id)->toBe($marker2->id);
    expect($orderedMarkers[3]->id)->toBe($marker1->id);
});

test('tour with duplicate markers maintains correct positions', function () {
    $tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    // Add same marker three times with different positions
    $tour->markers()->attach($marker->id, ['position' => 0]);
    $tour->markers()->attach($marker->id, ['position' => 1]);
    $tour->markers()->attach($marker->id, ['position' => 2]);

    // Get tour with markers
    $response = $this->actingAs($this->user)->getJson("/tours/{$tour->id}");

    $response->assertStatus(200);

    // Verify positions are correct in the response
    $markers = $response->json('markers');
    expect($markers)->toHaveCount(3);
    expect($markers[0]['position'])->toBe(0);
    expect($markers[1]['position'])->toBe(1);
    expect($markers[2]['position'])->toBe(2);
});
