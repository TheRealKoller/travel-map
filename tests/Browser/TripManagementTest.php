<?php

use App\Models\Trip;
use App\Models\User;

beforeEach(function (): void {
    $this->user = User::factory()->withoutTwoFactor()->create([
        'email' => 'tripuser@example.com',
        'password' => bcrypt('password'),
    ]);
});

it('shows trips page after login', function (): void {
    Trip::factory()->count(2)->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user);

    $page = visit('/trips');

    $page->assertPathIs('/trips')
        ->assertSee('Select a trip')
        ->assertSee('Create new trip');
});

it('shows existing trips on the trips page', function (): void {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'My Test Vacation',
    ]);

    $this->actingAs($this->user);

    $page = visit('/trips');

    $page->assertSee('My Test Vacation');
});

it('navigates to create trip page via create tile', function (): void {
    $this->actingAs($this->user);

    $page = visit('/trips');

    $page->click('@create-trip-tile')
        ->assertPathIs('/trips/create')
        ->assertSee('Create new trip');
});

it('creates a new trip and redirects to map', function (): void {
    // Note: The create trip page includes a ViewportMapPicker (Mapbox GL JS).
    // Client-side browser requests to Mapbox tile servers cannot be intercepted
    // via Http::fake() — only server-side HTTP calls are intercepted.
    // assertNoJavaScriptErrors() is intentionally NOT used here because Mapbox
    // GL will emit errors with the dummy token in .env.testing.
    $this->actingAs($this->user);

    $page = visit('/trips/create');

    $page->fill('@trip-name-input', 'Browser Test Trip')
        ->click('@save-button')
        ->assertPathContains('/map/');

    $this->assertDatabaseHas('trips', [
        'name' => 'Browser Test Trip',
        'user_id' => $this->user->id,
    ]);
});

it('cancel button on create trip returns to trips list', function (): void {
    $this->actingAs($this->user);

    $page = visit('/trips/create');

    $page->click('@cancel-button')
        ->assertPathIs('/trips');
});

it('navigates to trip edit page via dropdown menu', function (): void {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Editable Trip',
    ]);

    $this->actingAs($this->user);

    $page = visit('/trips');

    $page->click("@trip-actions-{$trip->id}")
        ->click("@edit-trip-button-{$trip->id}")
        ->assertPathIs("/trips/{$trip->id}/edit")
        ->assertSee('Edit trip');
});

it('updates a trip name on edit page', function (): void {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Old Trip Name',
    ]);

    $this->actingAs($this->user);

    $page = visit("/trips/{$trip->id}/edit");

    $page->clear('@trip-name-input')
        ->fill('@trip-name-input', 'Updated Trip Name')
        ->click('@save-button')
        ->assertPathIs('/trips');

    $this->assertDatabaseHas('trips', [
        'id' => $trip->id,
        'name' => 'Updated Trip Name',
    ]);
});
