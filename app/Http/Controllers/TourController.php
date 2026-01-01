<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TourController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $tripId = $request->query('trip_id');

        if (! $tripId) {
            return response()->json(['error' => 'trip_id is required'], 400);
        }

        $trip = Trip::findOrFail($tripId);
        $this->authorize('view', $trip);

        $tours = $trip->tours()->with('markers')->orderBy('created_at', 'asc')->get();

        return response()->json($tours);
    }

    public function store(StoreTourRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $tripId = $validated['trip_id'];

        $trip = Trip::findOrFail($tripId);
        $this->authorize('update', $trip);

        $tour = $trip->tours()->create([
            'name' => $validated['name'],
        ]);

        return response()->json($tour->load('markers'), 201);
    }

    public function show(Tour $tour): JsonResponse
    {
        $this->authorize('view', $tour);

        return response()->json($tour->load('markers'));
    }

    public function update(UpdateTourRequest $request, Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        $validated = $request->validated();

        $tour->update(['name' => $validated['name']]);

        return response()->json($tour->load('markers'));
    }

    public function destroy(Tour $tour): JsonResponse
    {
        $this->authorize('delete', $tour);

        $tour->delete();

        return response()->json(null, 204);
    }

    public function attachMarker(Request $request, Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        $validated = $request->validate([
            'marker_id' => 'required|uuid|exists:markers,id',
        ]);

        $marker = Marker::findOrFail($validated['marker_id']);

        // Verify marker belongs to same trip
        if ($marker->trip_id !== $tour->trip_id) {
            return response()->json(['error' => 'Marker does not belong to this tour\'s trip'], 422);
        }

        // Attach marker to tour if not already attached
        if (! $tour->markers()->where('marker_id', $marker->id)->exists()) {
            // Get the highest position and add 1
            $maxPosition = $tour->markers()->max('position') ?? -1;
            $tour->markers()->attach($marker->id, ['position' => $maxPosition + 1]);
        }

        return response()->json($tour->load('markers'));
    }

    public function detachMarker(Request $request, Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        $validated = $request->validate([
            'marker_id' => 'required|uuid|exists:markers,id',
        ]);

        $tour->markers()->detach($validated['marker_id']);

        return response()->json($tour->load('markers'));
    }

    public function reorderMarkers(Request $request, Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        $validated = $request->validate([
            'marker_ids' => 'required|array',
            'marker_ids.*' => 'required|uuid|exists:markers,id',
        ]);

        $markerIds = $validated['marker_ids'];

        // Update positions for each marker
        foreach ($markerIds as $index => $markerId) {
            $tour->markers()->updateExistingPivot($markerId, ['position' => $index]);
        }

        return response()->json($tour->load('markers'));
    }
}
