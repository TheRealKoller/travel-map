<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Models\Trip;
use App\Services\UnsplashService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly UnsplashService $unsplashService
    ) {}

    public function index(): JsonResponse
    {
        $trips = auth()->user()->trips()->orderBy('created_at', 'asc')->get();

        return response()->json($trips);
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $trip = auth()->user()->trips()->create([
            'name' => $validated['name'],
        ]);

        return response()->json($trip, 201);
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

        return response()->json($trip);
    }

    public function destroy(Trip $trip): JsonResponse
    {
        $this->authorize('delete', $trip);

        $trip->delete();

        return response()->json(null, 204);
    }

    /**
     * Fetch an Unsplash image for a trip.
     * This endpoint is called when the user clicks on the image placeholder.
     */
    public function fetchImage(Request $request, Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        $photoData = $this->unsplashService->getPhotoForTrip($trip->name);

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
}
