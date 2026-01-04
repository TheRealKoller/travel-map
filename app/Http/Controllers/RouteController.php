<?php

namespace App\Http\Controllers;

use App\Enums\TransportMode;
use App\Http\Resources\RouteResource;
use App\Models\Marker;
use App\Models\Route;
use App\Models\Trip;
use App\Services\RoutingService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly RoutingService $routingService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $tripId = $request->query('trip_id');

        if (! $tripId) {
            return response()->json(['error' => 'trip_id is required'], 400);
        }

        $trip = Trip::findOrFail($tripId);
        $this->authorize('view', $trip);

        $routes = $trip->routes()
            ->with(['startMarker', 'endMarker'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(RouteResource::collection($routes));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'start_marker_id' => 'required|uuid|exists:markers,id',
            'end_marker_id' => 'required|uuid|exists:markers,id|different:start_marker_id',
            'transport_mode' => 'required|string|in:driving-car,cycling-regular,foot-walking',
        ]);

        $trip = Trip::findOrFail($validated['trip_id']);
        $this->authorize('update', $trip);

        $startMarker = Marker::findOrFail($validated['start_marker_id']);
        $endMarker = Marker::findOrFail($validated['end_marker_id']);

        // Verify both markers belong to the same trip
        if ($startMarker->trip_id !== $trip->id || $endMarker->trip_id !== $trip->id) {
            return response()->json(['error' => 'Markers must belong to the same trip'], 422);
        }

        try {
            $transportMode = TransportMode::from($validated['transport_mode']);
            $routeData = $this->routingService->calculateRoute($startMarker, $endMarker, $transportMode);

            $route = Route::create([
                'trip_id' => $trip->id,
                'start_marker_id' => $startMarker->id,
                'end_marker_id' => $endMarker->id,
                'transport_mode' => $transportMode,
                'distance' => $routeData['distance'],
                'duration' => $routeData['duration'],
                'geometry' => $routeData['geometry'],
                'warning' => $routeData['warning'],
            ]);

            $route->load(['startMarker', 'endMarker']);

            return response()->json(new RouteResource($route), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to calculate route: '.$e->getMessage()], 500);
        }
    }

    public function show(Route $route): JsonResponse
    {
        $this->authorize('view', $route->trip);

        $route->load(['startMarker', 'endMarker']);

        return response()->json(new RouteResource($route));
    }

    public function destroy(Route $route): JsonResponse
    {
        $this->authorize('update', $route->trip);

        $route->delete();

        return response()->json(null, 204);
    }
}
