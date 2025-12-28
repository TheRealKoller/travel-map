<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMarkerRequest;
use App\Http\Requests\UpdateMarkerRequest;
use App\Models\Marker;
use App\Services\TripService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarkerController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly TripService $tripService
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
}
