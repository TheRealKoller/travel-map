<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMarkerRequest;
use App\Http\Requests\UpdateMarkerRequest;
use App\Models\Marker;
use App\Services\MapboxPlacesService;
use App\Services\TripService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarkerController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly TripService $tripService,
        private readonly MapboxPlacesService $mapboxPlacesService,
        private readonly \App\Services\UnsplashService $unsplashService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tripId = $request->query('trip_id');
        $trip = $this->tripService->getActiveTrip(auth()->user(), $tripId);

        $markers = $trip->markers;

        return response()->json($markers);
    }

    public function store(StoreMarkerRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $tripId = $request->input('trip_id');
        $trip = $this->tripService->getActiveTrip(auth()->user(), $tripId);

        $marker = $trip->markers()->create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        return response()->json($marker, 201);
    }

    public function update(UpdateMarkerRequest $request, Marker $marker): JsonResponse
    {
        $this->authorize('update', $marker);

        $validated = $request->validated();

        $marker->update($validated);

        return response()->json($marker);
    }

    public function destroy(Marker $marker): JsonResponse
    {
        $this->authorize('delete', $marker);

        $marker->delete();

        return response()->json(null, 204);
    }

    /**
     * Get available place types for search filtering.
     */
    public function placeTypes(): JsonResponse
    {
        $placeTypes = array_map(
            fn (\App\Enums\PlaceType $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ],
            \App\Enums\PlaceType::cases()
        );

        return response()->json($placeTypes);
    }

    /**
     * Search for points of interest near given coordinates using Mapbox Search API.
     */
    public function searchNearby(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['required', 'numeric', 'min:-180', 'max:180'],
            'radius_km' => ['required', 'integer', 'min:1', 'max:100'],
            'place_type' => ['nullable', 'string'],
        ]);

        // Convert place_type string to enum, default to null if not provided or invalid
        $placeType = isset($validated['place_type']) && $validated['place_type'] !== ''
            ? \App\Enums\PlaceType::tryFrom($validated['place_type'])
            : null;

        $result = $this->mapboxPlacesService->searchNearby(
            latitude: $validated['latitude'],
            longitude: $validated['longitude'],
            radiusKm: $validated['radius_km'],
            placeType: $placeType
        );

        return response()->json($result);
    }

    /**
     * Fetch an Unsplash image for a marker.
     * This endpoint is called when the user clicks on the image placeholder.
     */
    public function fetchImage(Request $request, Marker $marker): JsonResponse
    {
        $this->authorize('view', $marker);

        $photoData = $this->unsplashService->getPhotoForMarker($marker->name, $marker->type);

        if (! $photoData) {
            return response()->json([
                'error' => 'No image found for this marker',
            ], 404);
        }

        // Track the download to increment view count
        if (isset($photoData['download_location'])) {
            $this->unsplashService->trackDownload($photoData['download_location']);
        }

        // Update the marker with the image URL (hotlinked from Unsplash)
        $marker->update([
            'image_url' => $photoData['urls']['regular'] ?? null,
        ]);

        return response()->json([
            'photo' => $photoData,
            'marker' => $marker->fresh(),
        ]);
    }
}
