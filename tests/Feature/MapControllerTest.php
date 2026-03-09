<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('owner can view the map for their trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->get("/map/{$trip->id}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('map')
            ->has('trip')
            ->where('trip.id', $trip->id)
            ->where('trip.name', $trip->name)
            ->missing('owner')
        );
});

test('shared user can view the map for a trip', function () {
    $owner = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);
    $trip->sharedUsers()->attach($this->user);

    $response = $this->actingAs($this->user)->get("/map/{$trip->id}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('map')
            ->where('trip.id', $trip->id)
            ->missing('owner')
        );
});

test('unauthenticated user cannot view the map', function () {
    $trip = Trip::factory()->create();

    $response = $this->get("/map/{$trip->id}");

    $response->assertRedirect('/login');
});

test('unauthorized user receives 403 when viewing map', function () {
    $trip = Trip::factory()->create(); // belongs to a different user

    $response = $this->actingAs($this->user)->get("/map/{$trip->id}");

    $response->assertForbidden();
});

test('admin can view the map for any trip', function () {
    $admin = User::factory()->withoutTwoFactor()->admin()->create();
    $trip = Trip::factory()->create(); // belongs to a different user

    $response = $this->actingAs($admin)->get("/map/{$trip->id}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('map')
            ->where('trip.id', $trip->id)
        );
});

test('admin viewing another user trip receives owner prop for banner', function () {
    $admin = User::factory()->withoutTwoFactor()->admin()->create();
    $owner = User::factory()->withoutTwoFactor()->create();
    $trip = Trip::factory()->create(['user_id' => $owner->id]);

    $response = $this->actingAs($admin)->get("/map/{$trip->id}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('map')
            ->where('trip.id', $trip->id)
            ->where('trip.name', $trip->name)
            ->has('owner')
            ->where('owner.id', $owner->id)
            ->where('owner.name', $owner->name)
        );
});

test('admin viewing their own trip does not receive owner prop', function () {
    $admin = User::factory()->withoutTwoFactor()->admin()->create();
    $trip = Trip::factory()->create(['user_id' => $admin->id]);

    $response = $this->actingAs($admin)->get("/map/{$trip->id}");

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('map')
            ->where('trip.id', $trip->id)
            ->missing('owner')
        );
});
