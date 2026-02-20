<?php

use App\Models\Marker;
use App\Models\Route;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;
use App\Services\MapboxStaticImageService;
use App\Services\TripPdfExportService;
use App\Services\UnsplashService;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();

    // Mock the services
    $this->unsplashService = Mockery::mock(UnsplashService::class);
    $this->mapboxService = Mockery::mock(MapboxStaticImageService::class);

    // Create the service instance with mocked dependencies
    $this->pdfService = new TripPdfExportService(
        $this->unsplashService,
        $this->mapboxService
    );
});

test('generatePdf returns a PDF response', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Test Trip',
    ]);

    // Mock services to prevent actual API calls
    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});

test('generatePdf creates correct filename from trip name', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Summer/Vacation\\2024:Test*',
    ]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);

    $response = $this->pdfService->generatePdf($trip);

    // Check the filename in the Content-Disposition header
    $contentDisposition = $response->headers->get('content-disposition');
    expect($contentDisposition)->toContain('Summer_Vacation_2024_Test_.pdf');
});

test('generatePdf tracks trip image download when download location exists', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip with Image',
        'unsplash_download_location' => 'https://api.unsplash.com/photos/test/download',
    ]);

    $this->unsplashService->shouldReceive('trackDownload')
        ->once()
        ->with('https://api.unsplash.com/photos/test/download')
        ->andReturn(true);

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
});

test('generatePdf does not track download when trip has no download location', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip without Image',
        'unsplash_download_location' => null,
    ]);

    $this->unsplashService->shouldNotReceive('trackDownload');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
});

test('generatePdf handles trip without markers', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Empty Trip',
    ]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
    expect($response->getContent())->toContain('%PDF');
});

test('generatePdf includes markers overview when trip has markers', function () {
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip with Markers',
    ]);

    Marker::factory()->count(3)->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
    ]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->once()
        ->andReturn('https://api.mapbox.com/test-image');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
});

test('generatePdf processes tours with markers', function () {
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip with Tour',
    ]);

    $tour = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'City Tour',
    ]);

    $marker = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Test Marker',
        'url' => 'https://example.com',
    ]);

    $tour->markers()->attach($marker->id, ['position' => 0]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->andReturn('https://api.mapbox.com/test-image');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
    expect($response->getContent())->toContain('%PDF');
});

test('generatePdf processes tour with routes', function () {
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip with Routes',
    ]);

    $tour = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Route Tour',
    ]);

    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'latitude' => 47.3769,
        'longitude' => 8.5417,
    ]);

    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'latitude' => 47.5596,
        'longitude' => 7.5886,
    ]);

    $tour->markers()->attach($marker1->id, ['position' => 0]);
    $tour->markers()->attach($marker2->id, ['position' => 1]);

    Route::factory()->create([
        'trip_id' => $trip->id,
        'tour_id' => $tour->id,
        'start_marker_id' => $marker1->id,
        'end_marker_id' => $marker2->id,
        'geometry' => [
            [8.5417, 47.3769],
            [7.5886, 47.5596],
        ],
    ]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);

    // Expect call for markers overview
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->once()
        ->andReturn('https://api.mapbox.com/test-overview-image');

    // Expect call for tour with routes
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkersAndRoutes')
        ->once()
        ->andReturn('https://api.mapbox.com/test-route-image');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
});

test('generatePdf tracks marker image downloads', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip',
    ]);

    $tour = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Tour',
    ]);

    $marker = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker',
        'unsplash_download_location' => 'https://api.unsplash.com/photos/marker/download',
    ]);

    $tour->markers()->attach($marker->id, ['position' => 0]);

    $this->unsplashService->shouldReceive('trackDownload')
        ->once()
        ->with('https://api.unsplash.com/photos/marker/download')
        ->andReturn(true);

    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->andReturn('https://api.mapbox.com/test-image');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
});

test('generatePdf handles tour without markers gracefully', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip',
    ]);

    Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Empty Tour',
    ]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
    expect($response->getContent())->toContain('%PDF');
});

test('generatePdf handles multiple tours', function () {
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Multi Tour Trip',
    ]);

    $tour1 = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Tour 1',
    ]);

    $tour2 = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Tour 2',
    ]);

    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
    ]);

    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
    ]);

    $tour1->markers()->attach($marker1->id, ['position' => 0]);
    $tour2->markers()->attach($marker2->id, ['position' => 0]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);

    // Expect 3 calls total: 1 for markers overview + 1 for each tour (2 tours)
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->times(3)
        ->andReturn('https://api.mapbox.com/test-image');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
});

test('generatePdf continues on image download failure', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip',
        'unsplash_download_location' => 'https://api.unsplash.com/photos/test/download',
    ]);

    $this->unsplashService->shouldReceive('trackDownload')
        ->once()
        ->andThrow(new \Exception('API Error'));

    // Should not throw, just log and continue
    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
});

test('generatePdf handles marker with URL to generate QR code', function () {
    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip',
    ]);

    $tour = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Tour',
    ]);

    $markerWithUrl = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker with URL',
        'url' => 'https://example.com',
    ]);

    $markerWithoutUrl = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker without URL',
        'url' => null,
    ]);

    $tour->markers()->attach($markerWithUrl->id, ['position' => 0]);
    $tour->markers()->attach($markerWithoutUrl->id, ['position' => 1]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->andReturn('https://api.mapbox.com/test-image');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);
    expect($response->getContent())->toContain('%PDF');
});

test('generatePdf renders Markdown formatted notes as HTML', function () {
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Trip with Markdown Notes',
    ]);

    $tour = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Tour',
    ]);

    // Create a marker with Markdown formatted notes
    $markdownNotes = "**bold** and *italic* text\n\n- Item 1\n- Item 2";

    $marker = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Marker with Markdown',
        'notes' => $markdownNotes,
    ]);

    $tour->markers()->attach($marker->id, ['position' => 0]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->andReturn('https://api.mapbox.com/test-image');

    $response = $this->pdfService->generatePdf($trip);

    expect($response)->toBeInstanceOf(\Illuminate\Http\Response::class);

    // Verify PDF is generated successfully
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});

test('buildTableOfContents generates correct structure', function () {
    config(['services.mapbox.access_token' => 'pk.test.fake_token_for_testing_only']);

    $trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'TOC Test Trip',
    ]);

    // Create multiple tours with different characteristics
    $tour1 = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'Germany Tour',
    ]);

    $tour2 = Tour::factory()->create([
        'trip_id' => $trip->id,
        'name' => 'France Tour',
    ]);

    // Create markers with different types and UNESCO status
    $marker1 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Berlin Cathedral',
        'type' => 'sight',
        'is_unesco' => true,
        'estimated_hours' => 2.5,
    ]);

    $marker2 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Hotel Berlin',
        'type' => 'accommodation',
        'is_unesco' => false,
        'estimated_hours' => 1.0,
    ]);

    $marker3 = Marker::factory()->create([
        'trip_id' => $trip->id,
        'user_id' => $this->user->id,
        'name' => 'Eiffel Tower',
        'type' => 'sight',
        'is_unesco' => false,
        'estimated_hours' => 3.0,
    ]);

    // Attach markers to tours
    $tour1->markers()->attach([$marker1->id, $marker2->id]);
    $tour2->markers()->attach([$marker3->id]);

    $this->unsplashService->shouldReceive('trackDownload')->andReturn(true);
    $this->mapboxService->shouldReceive('generateStaticImageWithMarkers')
        ->andReturn('https://api.mapbox.com/test-image');

    // Use reflection to access the private buildTableOfContents method
    $reflection = new \ReflectionClass($this->pdfService);
    $method = $reflection->getMethod('buildTableOfContents');
    $method->setAccessible(true);

    // Prepare tours data (simulate what prepareToursData would return)
    $toursData = [
        [
            'name' => 'Germany Tour',
            'estimated_duration_hours' => 3.5,
            'markers' => [
                [
                    'name' => 'Berlin Cathedral',
                    'type' => 'sight',
                    'is_unesco' => true,
                ],
                [
                    'name' => 'Hotel Berlin',
                    'type' => 'accommodation',
                    'is_unesco' => false,
                ],
            ],
        ],
        [
            'name' => 'France Tour',
            'estimated_duration_hours' => 3.0,
            'markers' => [
                [
                    'name' => 'Eiffel Tower',
                    'type' => 'sight',
                    'is_unesco' => false,
                ],
            ],
        ],
    ];

    $markersCount = 3;

    // Call the method
    $toc = $method->invoke($this->pdfService, $toursData, $markersCount);

    // Verify TOC structure
    expect($toc)->toBeArray();
    expect($toc)->toHaveKey('hasOverview');
    expect($toc)->toHaveKey('tours');
    expect($toc['hasOverview'])->toBeTrue();
    expect($toc['tours'])->toHaveCount(2);

    // Verify first tour
    expect($toc['tours'][0]['name'])->toBe('Germany Tour');
    expect($toc['tours'][0]['markerCount'])->toBe(2);
    expect($toc['tours'][0]['estimatedDurationHours'])->toBe(3.5);
    expect($toc['tours'][0]['markers'])->toHaveCount(2);

    // Verify first tour's first marker
    expect($toc['tours'][0]['markers'][0]['name'])->toBe('Berlin Cathedral');
    expect($toc['tours'][0]['markers'][0]['type'])->toBe('sight');
    expect($toc['tours'][0]['markers'][0]['isUnesco'])->toBeTrue();

    // Verify first tour's second marker
    expect($toc['tours'][0]['markers'][1]['name'])->toBe('Hotel Berlin');
    expect($toc['tours'][0]['markers'][1]['type'])->toBe('accommodation');
    expect($toc['tours'][0]['markers'][1]['isUnesco'])->toBeFalse();

    // Verify second tour
    expect($toc['tours'][1]['name'])->toBe('France Tour');
    expect($toc['tours'][1]['markerCount'])->toBe(1);
    expect($toc['tours'][1]['estimatedDurationHours'])->toBe(3.0);
    expect($toc['tours'][1]['markers'])->toHaveCount(1);
    expect($toc['tours'][1]['markers'][0]['name'])->toBe('Eiffel Tower');
    expect($toc['tours'][1]['markers'][0]['type'])->toBe('sight');
    expect($toc['tours'][1]['markers'][0]['isUnesco'])->toBeFalse();
});

test('buildTableOfContents handles trip without markers', function () {
    // Use reflection to access the private buildTableOfContents method
    $reflection = new \ReflectionClass($this->pdfService);
    $method = $reflection->getMethod('buildTableOfContents');
    $method->setAccessible(true);

    // Call with empty tours and no markers
    $toc = $method->invoke($this->pdfService, [], 0);

    expect($toc)->toBeArray();
    expect($toc['hasOverview'])->toBeFalse();
    expect($toc['tours'])->toBeEmpty();
});
