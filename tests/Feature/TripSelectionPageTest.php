<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

test('authenticated user can access trip selection page', function () {
    $response = $this->actingAs($this->user)->get('/trips');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page->component('trips/index'));
});

test('unauthenticated user cannot access trip selection page', function () {
    $response = $this->get('/trips');

    $response->assertRedirect('/login');
});

test('trip selection page renders with inertia when requested as page', function () {
    Trip::factory()->count(3)->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->get('/trips');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page->component('trips/index'));
});

test('trip list returns json when requested via api', function () {
    Trip::factory()->count(3)->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)
        ->getJson('/trips');

    $response->assertStatus(200)
        ->assertJsonCount(3);
});

test('authenticated user can access map page with specific trip', function () {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user)->get("/map/{$trip->id}");

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('map')
        ->has('trip')
        ->where('trip.id', $trip->id)
    );
});

test('user cannot access map page for another users trip', function () {
    $otherUserTrip = Trip::factory()->create();

    $response = $this->actingAs($this->user)->get("/map/{$otherUserTrip->id}");

    $response->assertStatus(403);
});

test('home route redirects to trip selection page', function () {
    $response = $this->actingAs($this->user)->get('/');

    $response->assertRedirect('/trips');
});
