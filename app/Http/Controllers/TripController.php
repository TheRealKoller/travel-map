<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Models\Trip;
use App\Services\MapboxStaticImageService;
use App\Services\UnsplashService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class TripController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly UnsplashService $unsplashService,
        private readonly MapboxStaticImageService $mapboxStaticImageService
    ) {}

    public function index(Request $request): JsonResponse|Response
    {
        $trips = auth()->user()->trips()->orderBy('created_at', 'asc')->get();

        // If this is an API request (has Accept: application/json), return JSON
        if ($request->expectsJson()) {
            return response()->json($trips);
        }

        // Otherwise, return the Inertia page
        return Inertia::render('trips/index');
    }

    public function create(): Response
    {
        return Inertia::render('trips/create');
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $trip = auth()->user()->trips()->create([
            'name' => $validated['name'],
            'country' => $validated['country'] ?? null,
            'image_url' => $validated['image_url'] ?? null,
            'viewport_latitude' => $validated['viewport_latitude'] ?? null,
            'viewport_longitude' => $validated['viewport_longitude'] ?? null,
            'viewport_zoom' => $validated['viewport_zoom'] ?? null,
        ]);

        // Generate static image URL if viewport is set
        $this->updateViewportStaticImage($trip);

        // Auto-fetch image if both name and country are provided and no image_url yet
        if ($trip->name && $trip->country && ! $trip->image_url) {
            $this->autoFetchImage($trip);
        }

        return response()->json($trip->fresh(), 201);
    }

    public function edit(Trip $trip): Response
    {
        $this->authorize('update', $trip);

        return Inertia::render('trips/create', [
            'trip' => $trip,
        ]);
    }

    public function show(Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        return response()->json($trip);
    }

    public function update(UpdateTripRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('update', $trip);

        $validated = $request->validated();

        $trip->update($validated);

        // Generate static image URL if viewport is set
        $this->updateViewportStaticImage($trip);

        // Auto-fetch image if both name and country are provided and no image_url yet
        if ($trip->name && $trip->country && ! $trip->image_url) {
            $this->autoFetchImage($trip);
        }

        return response()->json($trip->fresh());
    }

    public function destroy(Trip $trip): JsonResponse
    {
        $this->authorize('delete', $trip);

        $trip->delete();

        return response()->json(null, 204);
    }

    /**
     * Export a trip as PDF.
     * Generates a PDF document with trip information including name, title image, map viewport, and markers overview.
     */
    public function exportPdf(Trip $trip): HttpResponse
    {
        $this->authorize('view', $trip);

        // Load markers for the trip
        $markers = $trip->markers()->get(['latitude', 'longitude'])->toArray();

        // Generate static image URL for markers overview if markers exist
        $markersOverviewUrl = null;
        if (! empty($markers)) {
            $markersOverviewUrl = $this->mapboxStaticImageService->generateStaticImageWithMarkers(
                markers: $markers,
                width: 800,
                height: 600,
                padding: 50
            );
        }

        // Convert external URLs to base64 data URIs for DomPDF compatibility
        $viewportImageUrl = $trip->viewport_static_image_url ? $this->convertImageToBase64($trip->viewport_static_image_url) : null;
        $markersOverviewBase64 = $markersOverviewUrl ? $this->convertImageToBase64($markersOverviewUrl) : null;

        $pdf = Pdf::loadView('trip-pdf', [
            'trip' => $trip,
            'viewportImageUrl' => $viewportImageUrl,
            'markersOverviewUrl' => $markersOverviewBase64,
            'markersCount' => count($markers),
        ]);

        // Generate a safe filename from the trip name
        $filename = preg_replace('/[^A-Za-z0-9_\-]/', '_', $trip->name).'.pdf';

        return $pdf->download($filename);
    }

    /**
     * Fetch an Unsplash image for a trip.
     * This endpoint is called when the user clicks on the image placeholder.
     */
    public function fetchImage(Request $request, Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        $photoData = $this->unsplashService->getPhotoForTrip($trip->name, $trip->country);

        if (! $photoData) {
            return response()->json([
                'error' => 'No image found for this trip',
            ], 404);
        }

        // Track the download to increment view count
        if (isset($photoData['download_location'])) {
            $this->unsplashService->trackDownload($photoData['download_location']);
        }

        // Update the trip with the image URL (hotlinked from Unsplash)
        $trip->update([
            'image_url' => $photoData['urls']['regular'] ?? null,
        ]);

        return response()->json([
            'photo' => $photoData,
            'trip' => $trip->fresh(),
        ]);
    }

    /**
     * Automatically fetch an Unsplash image for a trip.
     * This is called internally when creating/updating a trip.
     */
    private function autoFetchImage(Trip $trip): void
    {
        try {
            $photoData = $this->unsplashService->getPhotoForTrip($trip->name, $trip->country);

            if ($photoData && isset($photoData['urls']['regular'])) {
                // Track the download to increment view count
                if (isset($photoData['download_location'])) {
                    $this->unsplashService->trackDownload($photoData['download_location']);
                }

                // Update the trip with the image URL
                $trip->update([
                    'image_url' => $photoData['urls']['regular'],
                ]);
            }
        } catch (\Exception $e) {
            // Silently fail - image fetching is optional
            // The trip will still be created/updated without an image
            \Log::info('Failed to auto-fetch image for trip', [
                'trip_id' => $trip->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Update the viewport static image URL for a trip.
     * Generates a static map image URL if viewport coordinates are set,
     * otherwise clears the static image URL.
     */
    private function updateViewportStaticImage(Trip $trip): void
    {
        if ($trip->viewport_latitude !== null && $trip->viewport_longitude !== null && $trip->viewport_zoom !== null) {
            $staticImageUrl = $this->mapboxStaticImageService->generateStaticImageUrl(
                latitude: $trip->viewport_latitude,
                longitude: $trip->viewport_longitude,
                zoom: $trip->viewport_zoom
            );

            if ($staticImageUrl) {
                $trip->update(['viewport_static_image_url' => $staticImageUrl]);
            }
        } else {
            // Clear static image URL if viewport is removed
            $trip->update(['viewport_static_image_url' => null]);
        }
    }

    /**
     * Convert an image URL to a base64 data URI.
     * DomPDF cannot load external URLs directly, so we download the image and convert it to base64.
     *
     * @param  string  $url  The image URL to convert
     * @return string|null The base64 data URI or null if conversion fails
     */
    private function convertImageToBase64(string $url): ?string
    {
        try {
            // Download the image
            $imageContent = file_get_contents($url);

            if ($imageContent === false) {
                \Log::warning('Failed to download image for PDF', ['url' => $url]);

                return null;
            }

            // Detect MIME type from image content
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->buffer($imageContent);

            // Convert to base64 data URI
            $base64 = base64_encode($imageContent);

            return "data:{$mimeType};base64,{$base64}";
        } catch (\Exception $e) {
            \Log::error('Error converting image to base64 for PDF', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
