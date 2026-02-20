<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;
use App\Services\MapboxStaticImageService;

uses()->group('pdf');

test('exports trip with routes to PDF successfully', function () {
    // Mock MapboxStaticImageService to prevent real API calls
    $this->mock(MapboxStaticImageService::class, function ($mock) {
        $mock->shouldReceive('generateStaticImageWithMarkersAndRoutes')
            ->andReturn('https://api.mapbox.com/styles/v1/test/static/test.png');
        $mock->shouldReceive('generateStaticImageWithMarkers')
            ->andReturn('https://api.mapbox.com/styles/v1/test/static/test.png');
    });

    // Create a user
    $user = User::factory()->create();

    // Create a trip
    $trip = Trip::factory()->for($user)->create([
        'name' => 'Test Trip with Routes',
    ]);

    // Create a tour
    $tour = Tour::factory()->for($trip)->create([
        'name' => 'Berlin to Munich',
    ]);

    // Create markers
    $berlinMarker = Marker::factory()->for($trip)->create([
        'name' => 'Berlin',
        'latitude' => 52.5200,
        'longitude' => 13.4050,
    ]);

    $munichMarker = Marker::factory()->for($trip)->create([
        'name' => 'Munich',
        'latitude' => 48.1351,
        'longitude' => 11.5820,
    ]);

    // Attach markers to tour
    $tour->markers()->attach([$berlinMarker->id, $munichMarker->id]);

    // Create route with geometry
    Route::factory()->for($trip)->for($tour)->create([
        'start_marker_id' => $berlinMarker->id,
        'end_marker_id' => $munichMarker->id,
        'geometry' => [
            [13.4050, 52.5200], // Berlin
            [13.5, 52.0],
            [12.5, 51.0],
            [11.5, 50.0],
            [11.5820, 48.1351], // Munich
        ],
        'distance' => 584000, // ~584 km
        'duration' => 21600, // 6 hours
    ]);

    // Export PDF
    $response = $this->actingAs($user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
    // Filename is sanitized (spaces replaced with underscores)
    $response->assertDownload('Test_Trip_with_Routes.pdf');
});

test('exports trip with multiple routes to PDF successfully', function () {
    // Mock MapboxStaticImageService to prevent real API calls
    $this->mock(MapboxStaticImageService::class, function ($mock) {
        $mock->shouldReceive('generateStaticImageWithMarkersAndRoutes')
            ->andReturn('https://api.mapbox.com/styles/v1/test/static/test.png');
        $mock->shouldReceive('generateStaticImageWithMarkers')
            ->andReturn('https://api.mapbox.com/styles/v1/test/static/test.png');
    });

    // Create a user
    $user = User::factory()->create();

    // Create a trip
    $trip = Trip::factory()->for($user)->create([
        'name' => 'Multi-Route Trip',
    ]);

    // Create a tour
    $tour = Tour::factory()->for($trip)->create([
        'name' => 'Germany Tour',
    ]);

    // Create markers
    $berlin = Marker::factory()->for($trip)->create([
        'name' => 'Berlin',
        'latitude' => 52.5200,
        'longitude' => 13.4050,
    ]);

    $frankfurt = Marker::factory()->for($trip)->create([
        'name' => 'Frankfurt',
        'latitude' => 50.1109,
        'longitude' => 8.6821,
    ]);

    $munich = Marker::factory()->for($trip)->create([
        'name' => 'Munich',
        'latitude' => 48.1351,
        'longitude' => 11.5820,
    ]);

    // Attach markers to tour
    $tour->markers()->attach([$berlin->id, $frankfurt->id, $munich->id]);

    // Create routes
    Route::factory()->for($trip)->for($tour)->create([
        'start_marker_id' => $berlin->id,
        'end_marker_id' => $frankfurt->id,
        'geometry' => [
            [13.4050, 52.5200], // Berlin
            [12.0, 51.0],
            [10.0, 50.5],
            [8.6821, 50.1109], // Frankfurt
        ],
        'distance' => 550000,
        'duration' => 19800,
    ]);

    Route::factory()->for($trip)->for($tour)->create([
        'start_marker_id' => $frankfurt->id,
        'end_marker_id' => $munich->id,
        'geometry' => [
            [8.6821, 50.1109], // Frankfurt
            [9.5, 49.5],
            [10.5, 49.0],
            [11.5820, 48.1351], // Munich
        ],
        'distance' => 392000,
        'duration' => 14100,
    ]);

    // Export PDF
    $response = $this->actingAs($user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('exports trip without routes to PDF successfully', function () {
    // Mock MapboxStaticImageService to prevent real API calls
    $this->mock(MapboxStaticImageService::class, function ($mock) {
        $mock->shouldReceive('generateStaticImageWithMarkers')
            ->andReturn('https://api.mapbox.com/styles/v1/test/static/test.png');
    });

    // Create a user
    $user = User::factory()->create();

    // Create a trip with tour and markers but no routes
    $trip = Trip::factory()->for($user)->create([
        'name' => 'Trip Without Routes',
    ]);

    $tour = Tour::factory()->for($trip)->create([
        'name' => 'Markers Only Tour',
    ]);

    $marker1 = Marker::factory()->for($trip)->create();
    $marker2 = Marker::factory()->for($trip)->create();

    $tour->markers()->attach([$marker1->id, $marker2->id]);

    // Export PDF should still work without routes
    $response = $this->actingAs($user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertSuccessful();
    $response->assertHeader('Content-Type', 'application/pdf');
});

test('requires authentication to export trip PDF', function () {
    $trip = Trip::factory()->create();

    $response = $this->get("/trips/{$trip->id}/export-pdf");

    $response->assertRedirect('/login');
});

test('prevents exporting PDF for other users trips', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $trip = Trip::factory()->for($owner)->create();

    $response = $this->actingAs($otherUser)->get("/trips/{$trip->id}/export-pdf");

    $response->assertForbidden();
});

test('generates PDF with proper marker layout', function () {
    // Mock MapboxStaticImageService to prevent real API calls
    $this->mock(MapboxStaticImageService::class, function ($mock) {
        $mock->shouldReceive('generateStaticImageWithMarkers')
            ->andReturn('https://api.mapbox.com/styles/v1/test/static/test.png');
    });

    $user = User::factory()->create();
    $trip = Trip::factory()->for($user)->create();
    $tour = Tour::factory()->for($trip)->create();

    // Create many markers to force multiple pages
    $markers = Marker::factory()
        ->count(20)
        ->for($trip)
        ->create([
            'notes' => fake()->paragraphs(3, true), // Longer notes
        ]);

    $tour->markers()->attach($markers->pluck('id'));

    $response = $this->actingAs($user)->get("/trips/{$trip->id}/export-pdf");

    $response->assertSuccessful();
    $response->assertHeader('content-type', 'application/pdf');

    // Note: Actual page break validation would require PDF parsing library
    // This test ensures the PDF generation doesn't crash with many markers
});
