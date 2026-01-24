<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('TripObserver generates static image URL when creating trip with viewport', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 7.5,
    ]);

    expect($trip->viewport_static_image_url)->not->toBeNull()
        ->and($trip->viewport_static_image_url)->toContain('api.mapbox.com/styles/v1/the-koller/cmkk2r7cg00gl01r15b1achfj/static');
});

test('TripObserver does not generate static image URL when creating trip without viewport', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => null,
        'viewport_longitude' => null,
        'viewport_zoom' => null,
    ]);

    expect($trip->viewport_static_image_url)->toBeNull();
});

test('TripObserver generates static image URL when updating trip with viewport', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => null,
        'viewport_longitude' => null,
        'viewport_zoom' => null,
    ]);

    expect($trip->viewport_static_image_url)->toBeNull();

    $trip->update([
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);

    expect($trip->viewport_static_image_url)->not->toBeNull()
        ->and($trip->viewport_static_image_url)->toContain('api.mapbox.com/styles/v1/the-koller/cmkk2r7cg00gl01r15b1achfj/static');
});

test('TripObserver clears static image URL when removing viewport from trip', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);

    expect($trip->viewport_static_image_url)->not->toBeNull();

    $trip->update([
        'viewport_latitude' => null,
        'viewport_longitude' => null,
        'viewport_zoom' => null,
    ]);

    expect($trip->viewport_static_image_url)->toBeNull();
});

test('TripObserver updates static image URL when viewport changes', function () {
    // Configure a fake Mapbox token for testing
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => 8.5417,
        'viewport_zoom' => 12.5,
    ]);

    $oldStaticImageUrl = $trip->viewport_static_image_url;
    expect($oldStaticImageUrl)->not->toBeNull()
        ->and($oldStaticImageUrl)->toContain('8.5417,47.3769,12.5');

    $trip->update([
        'viewport_latitude' => 46.9480,
        'viewport_longitude' => 7.4474,
        'viewport_zoom' => 10,
    ]);

    expect($trip->viewport_static_image_url)->not->toBe($oldStaticImageUrl)
        ->and($trip->viewport_static_image_url)->toContain('7.4474,46.948,10');
});

test('TripObserver handles partial viewport data correctly', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'viewport_latitude' => 47.3769,
        'viewport_longitude' => null, // Missing longitude
        'viewport_zoom' => 12.5,
    ]);

    // Should not generate static image if viewport is incomplete
    expect($trip->viewport_static_image_url)->toBeNull();
});

test('TripObserver does not interfere with other trip updates', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Original Name',
    ]);

    $trip->update([
        'name' => 'Updated Name',
    ]);

    expect($trip->name)->toBe('Updated Name')
        ->and($trip->viewport_static_image_url)->toBeNull();
});
