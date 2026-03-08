<?php

use App\Models\Trip;
use App\Models\User;

test('hasAccess returns true for trip owner', function () {
    $owner = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    expect($trip->hasAccess($owner))->toBeTrue();
});

test('hasAccess returns false for unrelated user', function () {
    $owner = User::factory()->withoutTwoFactor()->create();
    $other = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    expect($trip->hasAccess($other))->toBeFalse();
});

test('hasAccess returns true for shared user via db query', function () {
    $owner = User::factory()->withoutTwoFactor()->create();
    $collaborator = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $trip->sharedUsers()->attach($collaborator->id);

    expect($trip->hasAccess($collaborator))->toBeTrue();
});

test('hasAccess returns true for shared user when relation is already loaded', function () {
    $owner = User::factory()->withoutTwoFactor()->create();
    $collaborator = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $trip->sharedUsers()->attach($collaborator->id);

    // Eager-load the relation to exercise the in-memory path
    $trip->load('sharedUsers');

    expect($trip->hasAccess($collaborator))->toBeTrue();
});

test('hasAccess returns false for unrelated user when relation is already loaded', function () {
    $owner = User::factory()->withoutTwoFactor()->create();
    $other = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    // Eager-load the (empty) relation to exercise the in-memory path
    $trip->load('sharedUsers');

    expect($trip->hasAccess($other))->toBeFalse();
});
