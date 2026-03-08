<?php

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    // Fake all external HTTP calls (Mapbox, Unsplash, etc.)
    Http::fake([
        'api.mapbox.com/*' => Http::response(['features' => []], 200),
        'api.unsplash.com/*' => Http::response([], 200),
        'api.mistral.ai/*' => Http::response([], 200),
        'routes.googleapis.com/*' => Http::response([], 200),
        '*' => Http::response([], 200),
    ]);

    $this->user = User::factory()->withoutTwoFactor()->create([
        'email' => 'mapuser@example.com',
        'password' => bcrypt('password'),
    ]);
});

it('loads the map page for authenticated user with a trip', function (): void {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user);

    // Note: assertNoJavaScriptErrors() is intentionally NOT used here
    // because Mapbox GL JS will error with the dummy token in .env.testing
    $page = visit("/map/{$trip->id}");

    $page->assertPathIs("/map/{$trip->id}");
});

it('shows the map toolbar on the map page', function (): void {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user);

    $page = visit("/map/{$trip->id}");

    $page->assertVisible('@map-toolbar');
});

it('shows the map panel on the map page', function (): void {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user);

    $page = visit("/map/{$trip->id}");

    $page->assertVisible('@map-panel');
});

it('shows existing markers in the marker list', function (): void {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);
    Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Eiffel Tower',
    ]);

    $this->actingAs($this->user);

    $page = visit("/map/{$trip->id}");

    $page->assertSee('Eiffel Tower');
});

it('redirects to login when visiting map without authentication', function (): void {
    $trip = Trip::factory()->create(['user_id' => $this->user->id]);

    $page = visit("/map/{$trip->id}");

    $page->assertPathIs('/login');
});
