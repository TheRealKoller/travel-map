<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMarkerRequest;
use App\Http\Requests\UpdateMarkerRequest;
use App\Models\Marker;
use App\Services\OverpassService;
use App\Services\TripService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarkerController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly TripService $tripService,
        private readonly OverpassService $overpassService
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
     * Search for points of interest near given coordinates using Overpass API.
     */
    public function searchNearby(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['required', 'numeric', 'min:-180', 'max:180'],
            'radius_km' => ['required', 'integer', 'min:1', 'max:100'],
            'place_type' => ['nullable', 'string'],
        ]);

        // Convert place_type string to enum, default to All if not provided or invalid
        $placeType = null;
        if (isset($validated['place_type']) && $validated['place_type'] !== '') {
            $placeType = \App\Enums\PlaceType::tryFrom($validated['place_type']);
        }

        $result = $this->overpassService->searchNearby(
            latitude: $validated['latitude'],
            longitude: $validated['longitude'],
            radiusKm: $validated['radius_km'],
            placeType: $placeType
        );

        return response()->json($result);
    }
}
