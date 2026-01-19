<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('authenticated user can list their trips', function () {
    Trip::factory()->count(3)->create(['user_id' => $this->user->id]);
    Trip::factory()->count(2)->create(); // Other user's trips

    $response = $this->actingAs($this->user)->getJson('/trips');

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

test('authenticated user can create a trip', function () {
    $tripData = ['name' => 'Summer Vacation 2024'];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Summer Vacation 2024']);

    $this->assertDatabaseHas('trips', [
        'name' => 'Summer Vacation 2024',
        'user_id' => $this->user->id,
    ]);
});

test('trip name is required when creating', function () {
    $response = $this->actingAs($this->user)->postJson('/trips', []);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

test('authenticated user can create a trip with country', function () {
    $tripData = [
        'name' => 'Germany Trip',
        'country' => 'DE',
    ];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201)
        ->assertJsonFragment([
            'name' => 'Germany Trip',
            'country' => 'DE',
        ]);

    $this->assertDatabaseHas('trips', [
        'name' => 'Germany Trip',
        'country' => 'DE',
        'user_id' => $this->user->id,
    ]);
});

test('authenticated user can create a trip with viewport', function () {
    $tripData = [
        'name' => 'Switzerland Trip',
        'country' => 'CH',
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 7.5,
    ];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201)
        ->assertJsonFragment([
            'name' => 'Switzerland Trip',
            'country' => 'CH',
            'viewport_latitude' => 47.3769,
            'viewport_longitude' => 8.5417,
            'viewport_zoom' => 7.5,
        ]);

    $this->assertDatabaseHas('trips', [
        'name' => 'Switzerland Trip',
        'country' => 'CH',
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 7.5,
        'user_id' => $this->user->id,
    ]);
});

test('viewport fields are optional when creating trip', function () {
    $tripData = [
        'name' => 'Simple Trip',
    ];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201)
        ->assertJsonFragment(['name' => 'Simple Trip']);

    $this->assertDatabaseHas('trips', [
        'name' => 'Simple Trip',
        'viewport_latitude' => null,
        'viewport_longitude' => null,
        'viewport_zoom' => null,
    ]);
});

test('country must be exactly 2 characters if provided', function () {
    $response = $this->actingAs($this->user)->postJson('/trips', [
        'name' => 'Trip',
        'country' => 'DEU',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['country']);
});

test('authenticated user can view their own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->getJson("/trips/{$trip->id}");

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => $trip->name]);
});

test('user cannot view another users trip', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->getJson("/trips/{$otherTrip->id}");

    $response->assertStatus(403);
});

test('authenticated user can update their own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'name' => 'Updated Trip Name',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Trip Name']);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'name' => 'Updated Trip Name',
    ]);
});

test('user cannot update another users trip', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->putJson("/trips/{$otherTrip->id}", [
        'name' => 'Hacked Name',
    ]);

    $response->assertStatus(403);
});

test('authenticated user can delete their own trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->deleteJson("/trips/{$trip->id}");

    $response->assertStatus(204);

    $this->assertDatabaseMissing('trips', ['id' => $trip->id]);
});

test('user cannot delete another users trip', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->deleteJson("/trips/{$otherTrip->id}");

    $response->assertStatus(403);
});

test('deleting a trip also deletes all associated data', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    // Create associated data
    $marker = \App\Models\Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
    ]);

    $tour = \App\Models\Tour::factory()->create([
        'trip_id' => $trip->id,
    ]);

    $route = \App\Models\Route::factory()->create([
        'trip_id' => $trip->id,
    ]);

    // Delete the trip
    $response = $this->actingAs($this->user)->deleteJson("/trips/{$trip->id}");

    $response->assertStatus(204);

    // Verify all associated data is deleted
    $this->assertDatabaseMissing('trips', ['id' => $trip->id]);
    $this->assertDatabaseMissing('markers', ['id' => $marker->id]);
    $this->assertDatabaseMissing('tours', ['id' => $tour->id]);
    $this->assertDatabaseMissing('routes', ['id' => $route->id]);
});

test('unauthenticated user cannot access trip endpoints', function () {
    $this->getJson('/trips')->assertStatus(401);
    $this->postJson('/trips', ['name' => 'Test'])->assertStatus(401);
    $this->getJson('/trips/1')->assertStatus(401);
    $this->putJson('/trips/1', ['name' => 'Test'])->assertStatus(401);
    $this->deleteJson('/trips/1')->assertStatus(401);
});

test('authenticated user can access trip creation page', function () {
    $response = $this->actingAs($this->user)->get('/trips/create');

    $response->assertStatus(200);
});

test('unauthenticated user cannot access trip creation page', function () {
    $response = $this->get('/trips/create');

    $response->assertRedirect('/login');
});

test('authenticated user can access trip edit page', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->get("/trips/{$trip->id}/edit");

    $response->assertStatus(200);
});

test('user cannot access edit page for another users trip', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->get("/trips/{$otherTrip->id}/edit");

    $response->assertStatus(403);
});

test('unauthenticated user cannot access trip edit page', function () {
    $trip = Trip::factory()->create();

    $response = $this->get("/trips/{$trip->id}/edit");

    $response->assertRedirect('/login');
});

test('authenticated user can set viewport for their trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment([
            'viewport_latitude' => 47.3769,
            'viewport_longitude' => 8.5417,
            'viewport_zoom' => 12.5,
        ]);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);
});

test('viewport fields are optional when updating trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'name' => 'Just Rename',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => 'Just Rename']);
});

test('viewport latitude must be between -90 and 90', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => 95,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['viewport_latitude']);
});

test('viewport longitude must be between -180 and 180', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 185,
        'viewport_zoom' => 12.5,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['viewport_longitude']);
});

test('viewport zoom must be between 0 and 22', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 25,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['viewport_zoom']);
});

test('viewport fields can be set to null', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => null,
        'viewport_longitude' => null,
        'viewport_zoom' => null,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'viewport_latitude' => null,
        'viewport_longitude' => null,
        'viewport_zoom' => null,
    ]);
});

test('authenticated user can create a trip with image_url', function () {
    $tripData = [
        'name' => 'Paris Trip',
        'country' => 'FR',
        'image_url' => 'https://images.unsplash.com/photo-example',
    ];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201)
        ->assertJsonFragment([
            'name' => 'Paris Trip',
            'country' => 'FR',
            'image_url' => 'https://images.unsplash.com/photo-example',
        ]);

    $this->assertDatabaseHas('trips', [
        'name' => 'Paris Trip',
        'country' => 'FR',
        'image_url' => 'https://images.unsplash.com/photo-example',
        'user_id' => $this->user->id,
    ]);
});

test('image_url must be a valid URL if provided', function () {
    $response = $this->actingAs($this->user)->postJson('/trips', [
        'name' => 'Trip',
        'country' => 'DE',
        'image_url' => 'not-a-valid-url',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['image_url']);
});

test('authenticated user can update trip image_url', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'image_url' => 'https://images.unsplash.com/photo-updated',
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['image_url' => 'https://images.unsplash.com/photo-updated']);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'image_url' => 'https://images.unsplash.com/photo-updated',
    ]);
});

test('authenticated user can clear trip image_url', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'image_url' => 'https://images.unsplash.com/photo-example',
    ]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'image_url' => null,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'image_url' => null,
    ]);
});

test('static map image URL is generated when creating trip with viewport', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $tripData = [
        'name' => 'Switzerland Trip',
        'country' => 'CH',
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 7.5,
    ];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201);
    $trip = Trip::find($response->json('id'));

    expect($trip->viewport_static_image_url)->not->toBeNull()
        ->and($trip->viewport_static_image_url)->toContain('api.mapbox.com/styles/v1/the-koller/cmkk2r7cg00gl01r15b1achfj/static');
});

test('static map image URL is not generated when creating trip without viewport', function () {
    $tripData = [
        'name' => 'Simple Trip',
    ];

    $response = $this->actingAs($this->user)->postJson('/trips', $tripData);

    $response->assertStatus(201);
    $trip = Trip::find($response->json('id'));

    expect($trip->viewport_static_image_url)->toBeNull();
});

test('static map image URL is generated when updating trip with viewport', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);

    $response->assertStatus(200);
    $trip = $trip->fresh();

    expect($trip->viewport_static_image_url)->not->toBeNull()
        ->and($trip->viewport_static_image_url)->toContain('api.mapbox.com/styles/v1/the-koller/cmkk2r7cg00gl01r15b1achfj/static');
});

test('static map image URL is cleared when removing viewport from trip', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
        'viewport_static_image_url' => 'https://api.mapbox.com/styles/v1/the-koller/cmkk2r7cg00gl01r15b1achfj/static/8.5417,47.3769,12.5,0,0/800x400?access_token=test',
    ]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => null,
        'viewport_longitude' => null,
        'viewport_zoom' => null,
    ]);

    $response->assertStatus(200);
    $trip = $trip->fresh();

    expect($trip->viewport_static_image_url)->toBeNull();
});

test('static map image URL is updated when viewport changes', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
        'viewport_static_image_url' => 'https://api.mapbox.com/old-url',
    ]);

    $response = $this->actingAs($this->user)->putJson("/trips/{$trip->id}", [
        'viewport_latitude' => 46.9480,
        'viewport_longitude' => 7.4474,
        'viewport_zoom' => 10,
    ]);

    $response->assertStatus(200);
    $trip = $trip->fresh();

    expect($trip->viewport_static_image_url)->not->toBe('https://api.mapbox.com/old-url')
        ->and($trip->viewport_static_image_url)->toContain('7.4474,46.948,10');
});

test('authenticated user can export their trip as PDF', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Summer Vacation 2024',
    ]);

    $response = $this->actingAs($this->user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertStatus(200)
        ->assertHeader('content-type', 'application/pdf')
        ->assertDownload('Summer_Vacation_2024.pdf');
});

test('user cannot export another users trip as PDF', function () {
    $otherTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->get("/trips/{$otherTrip->id}/export-pdf");

    $response->assertStatus(403);
});

test('unauthenticated user cannot export trip as PDF', function () {
    $trip = Trip::factory()->create();

    $response = $this->get("/trips/{$trip->id}/export-pdf");

    $response->assertRedirect('/login');
});

test('PDF filename sanitizes special characters', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip/With\\Special:Characters*',
    ]);

    $response = $this->actingAs($this->user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertStatus(200)
        ->assertDownload('Trip_With_Special_Characters_.pdf');
});

test('PDF includes markers overview when trip has markers', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip with Markers',
    ]);

    // Create some markers for the trip
    \App\Models\Marker::factory()->count(3)->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertStatus(200)
        ->assertHeader('content-type', 'application/pdf');
});

test('PDF export works when trip has no markers', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip without Markers',
    ]);

    $response = $this->actingAs($this->user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertStatus(200)
        ->assertHeader('content-type', 'application/pdf');
});
