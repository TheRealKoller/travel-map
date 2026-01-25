<?php

namespace App\Http\Controllers;

use App\Exceptions\MapboxQuotaExceededException;
use App\Exceptions\RoutingProviderException;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Http\Resources\TourResource;
use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Services\MapboxMatrixService;
use App\Services\TourSortingService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

        $tours = $trip->tours()
            ->with(['markers', 'routes'])
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(TourResource::collection($tours));
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

        return response()->json(new TourResource($tour->load(['markers', 'routes'])), 201);
    }

    public function show(Tour $tour): JsonResponse
    {
        $this->authorize('view', $tour);

        return response()->json(new TourResource($tour->load(['markers', 'routes'])));
    }

    public function update(UpdateTourRequest $request, Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        $validated = $request->validated();

        $tour->update(['name' => $validated['name']]);

        return response()->json(new TourResource($tour->load(['markers', 'routes'])));
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

        // Get the highest position and add 1
        $maxPosition = $tour->markers()->max('position') ?? -1;
        $tour->markers()->attach($marker->id, ['position' => $maxPosition + 1]);

        return response()->json(new TourResource($tour->load(['markers', 'routes'])));
    }

    public function detachMarker(Request $request, Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        $validated = $request->validate([
            'marker_id' => 'required|uuid|exists:markers,id',
        ]);

        // When duplicates are allowed, only remove one instance of the marker
        // Get the first pivot record for this marker-tour combination
        $pivotRecord = DB::table('marker_tour')
            ->where('tour_id', $tour->id)
            ->where('marker_id', $validated['marker_id'])
            ->orderBy('position', 'asc')
            ->first();

        if ($pivotRecord) {
            DB::table('marker_tour')
                ->where('id', $pivotRecord->id)
                ->delete();
        }

        return response()->json(new TourResource($tour->load(['markers', 'routes'])));
    }

    public function reorderMarkers(Request $request, Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        $validated = $request->validate([
            'marker_ids' => 'required|array',
            'marker_ids.*' => 'required|uuid|exists:markers,id',
        ]);

        $markerIds = $validated['marker_ids'];

        // Detach all current markers
        $tour->markers()->detach();

        // Re-attach markers in the new order
        foreach ($markerIds as $index => $markerId) {
            $tour->markers()->attach($markerId, ['position' => $index]);
        }

        return response()->json(new TourResource($tour->load(['markers', 'routes'])));
    }

    /**
     * Automatically sort markers in a tour based on shortest walking distance.
     * Uses Mapbox Matrix API to calculate walking distances between all markers,
     * then applies a nearest neighbor algorithm to find an optimal order.
     */
    public function sortMarkers(Tour $tour): JsonResponse
    {
        $this->authorize('update', $tour);

        // Load markers in their current order
        $markers = $tour->markers()->get()->all();

        if (count($markers) < 2) {
            return response()->json([
                'error' => 'Tour must have at least 2 markers to sort',
            ], 422);
        }

        if (count($markers) > 25) {
            return response()->json([
                'error' => 'Tour has too many markers. Maximum is 25 markers for automatic sorting.',
            ], 422);
        }

        try {
            // Calculate distance matrix using Mapbox Matrix API
            $matrixService = app(MapboxMatrixService::class);
            $matrix = $matrixService->calculateMatrix($markers);

            // Sort markers optimally using the distance matrix
            $sortingService = app(TourSortingService::class);
            $sortedMarkerIds = $sortingService->sortMarkersOptimally($markers, $matrix);

            // Update marker positions in database
            $tour->markers()->detach();
            foreach ($sortedMarkerIds as $index => $markerId) {
                $tour->markers()->attach($markerId, ['position' => $index]);
            }

            Log::info('Tour markers sorted successfully', [
                'tour_id' => $tour->id,
                'marker_count' => count($markers),
            ]);

            return response()->json(new TourResource($tour->load(['markers', 'routes'])));
        } catch (MapboxQuotaExceededException $e) {
            return response()->json(['error' => $e->getMessage()], 429);
        } catch (RoutingProviderException $e) {
            return response()->json(['error' => $e->getMessage()], 503);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('Failed to sort tour markers', [
                'tour_id' => $tour->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to sort markers. Please try again.',
            ], 500);
        }
    }
}
