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

test('authenticated user can create a sub-tour', function () {
    $subTourData = [
        'name' => 'Morning activities',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ];

    $response = $this->actingAs($this->user)->postJson('/tours', $subTourData);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Morning activities'])
        ->assertJsonFragment(['parent_tour_id' => $this->tour->id]);

    $this->assertDatabaseHas('tours', [
        'name' => 'Morning activities',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);
});

test('sub-tour name must be unique within parent tour', function () {
    // Create a sub-tour
    Tour::factory()->create([
        'name' => 'Morning activities',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    // Try to create another sub-tour with same name in same parent
    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'Morning activities',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('sub-tour name can be same as another sub-tour in different parent tour', function () {
    $anotherTour = Tour::factory()->create(['trip_id' => $this->trip->id]);

    // Create a sub-tour in first tour
    Tour::factory()->create([
        'name' => 'Morning activities',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    // Create a sub-tour with same name in another tour (should succeed)
    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'Morning activities',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $anotherTour->id,
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Morning activities'])
        ->assertJsonFragment(['parent_tour_id' => $anotherTour->id]);
});

test('sub-tour name can be same as parent tour name', function () {
    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => $this->tour->name,
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => $this->tour->name])
        ->assertJsonFragment(['parent_tour_id' => $this->tour->id]);
});

test('top-level tour names remain unique among themselves', function () {
    Tour::factory()->create([
        'name' => 'Day 1',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => null,
    ]);

    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'Day 1',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => null,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('authenticated user can delete a sub-tour', function () {
    $subTour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$subTour->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('tours', ['id' => $subTour->id]);
});

test('deleting parent tour also deletes sub-tours', function () {
    $subTour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    $response = $this->actingAs($this->user)->deleteJson("/tours/{$this->tour->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('tours', ['id' => $this->tour->id]);
    $this->assertDatabaseMissing('tours', ['id' => $subTour->id]);
});

test('tour list includes sub-tours', function () {
    $subTour = Tour::factory()->create([
        'name' => 'Morning activities',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    $response = $this->actingAs($this->user)->getJson("/tours?trip_id={$this->trip->id}");

    $response->assertStatus(200);

    $tours = $response->json();
    expect($tours)->toHaveCount(1);
    expect($tours[0]['sub_tours'])->toHaveCount(1);
    expect($tours[0]['sub_tours'][0]['name'])->toBe('Morning activities');
});

test('sub-tours are ordered by position', function () {
    $subTour1 = Tour::factory()->create([
        'name' => 'First',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 1,
    ]);

    $subTour2 = Tour::factory()->create([
        'name' => 'Second',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 0,
    ]);

    $response = $this->actingAs($this->user)->getJson("/tours?trip_id={$this->trip->id}");

    $response->assertStatus(200);

    $tours = $response->json();
    expect($tours[0]['sub_tours'][0]['name'])->toBe('Second');
    expect($tours[0]['sub_tours'][1]['name'])->toBe('First');
});

test('authenticated user can reorder sub-tours', function () {
    $subTour1 = Tour::factory()->create([
        'name' => 'First',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 0,
    ]);

    $subTour2 = Tour::factory()->create([
        'name' => 'Second',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 1,
    ]);

    $response = $this->actingAs($this->user)->putJson("/tours/{$this->tour->id}/sub-tours/reorder", [
        'sub_tour_ids' => [$subTour2->id, $subTour1->id],
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('tours', ['id' => $subTour2->id, 'position' => 0]);
    $this->assertDatabaseHas('tours', ['id' => $subTour1->id, 'position' => 1]);
});

test('markers can be attached to sub-tours', function () {
    $subTour = Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->postJson("/tours/{$subTour->id}/markers", [
        'marker_id' => $marker->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $subTour->id,
    ]);
});

test('parent tour must belong to same trip when creating sub-tour', function () {
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'Invalid sub-tour',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $otherTour->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['error' => 'Parent tour does not belong to this trip']);
});

test('sub-tour is auto-positioned at the end', function () {
    Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 0,
    ]);

    Tour::factory()->create([
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
        'position' => 1,
    ]);

    $response = $this->actingAs($this->user)->postJson('/tours', [
        'name' => 'New sub-tour',
        'trip_id' => $this->trip->id,
        'parent_tour_id' => $this->tour->id,
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['position' => 2]);
});
