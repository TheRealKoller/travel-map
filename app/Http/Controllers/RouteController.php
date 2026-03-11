<?php

namespace App\Http\Controllers;

use App\Enums\TransportMode;
use App\Exceptions\MapboxQuotaExceededException;
use App\Exceptions\RouteNotFoundException;
use App\Exceptions\RoutingProviderException;
use App\Http\Requests\RouteIndexRequest;
use App\Http\Requests\StoreRouteRequest;
use App\Http\Requests\UpdateRouteAlternativeRequest;
use App\Http\Resources\RouteResource;
use App\Models\Marker;
use App\Models\Route;
use App\Services\RoutingService;
use App\Services\TripService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class RouteController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly RoutingService $routingService,
        private readonly TripService $tripService
    ) {}

    public function index(RouteIndexRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $tripId = $validated['trip_id'];

        $trip = $this->tripService->findTripForUser($request->user(), $tripId);

        $routes = $trip->routes()
            ->with(['startMarker', 'endMarker'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(RouteResource::collection($routes));
    }

    public function store(StoreRouteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $trip = $this->tripService->findTripForUser($request->user(), $validated['trip_id']);

        $startMarker = Marker::findOrFail($validated['start_marker_id']);
        $endMarker = Marker::findOrFail($validated['end_marker_id']);

        if (! $this->tripService->assertMarkersBelongToTrip($trip, $startMarker, $endMarker)) {
            throw new \App\Exceptions\BusinessLogicException('Markers must belong to the same trip');
        }

        try {
            $transportMode = TransportMode::from($validated['transport_mode']);
            $waypoints = $validated['waypoints'] ?? [];
            $routeData = $this->routingService->calculateRoute($startMarker, $endMarker, $transportMode, $waypoints);

            $route = Route::create([
                'trip_id' => $trip->id,
                'tour_id' => $validated['tour_id'] ?? null,
                'start_marker_id' => $startMarker->id,
                'end_marker_id' => $endMarker->id,
                'transport_mode' => $transportMode,
                'distance' => $routeData['distance'],
                'duration' => $routeData['duration'],
                'geometry' => $routeData['geometry'],
                'waypoints' => ! empty($waypoints) ? $waypoints : null,
                'transit_details' => $routeData['transit_details'] ?? null,
                'alternatives' => $routeData['alternatives'] ?? null,
                'warning' => $routeData['warning'] ?? null,
            ]);

            $route->load(['startMarker', 'endMarker']);

            return response()->json(new RouteResource($route), 201);
        } catch (RouteNotFoundException $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        } catch (MapboxQuotaExceededException $e) {
            return response()->json(['error' => $e->getMessage()], 429);
        } catch (RoutingProviderException $e) {
            return response()->json(['error' => $e->getMessage()], 503);
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

    public function updateAlternative(UpdateRouteAlternativeRequest $request, Route $route): JsonResponse
    {
        $this->authorize('update', $route->trip);

        if ($route->transport_mode !== TransportMode::PublicTransport) {
            return response()->json(['error' => 'Alternative selection is only available for public transport routes'], 422);
        }

        $alternatives = $route->alternatives ?? [];
        $index = $request->validated()['alternative_index'];

        if ($index >= count($alternatives)) {
            return response()->json(['error' => 'Alternative index out of range'], 422);
        }

        $chosen = $alternatives[$index];

        $route->update([
            'distance' => $chosen['distance'],
            'duration' => $chosen['duration'],
            'geometry' => $chosen['geometry'] ?? $route->geometry,
            'transit_details' => $chosen['transit_details'] ?? $route->transit_details,
            'alternatives' => null,
        ]);

        $route->load(['startMarker', 'endMarker']);

        return response()->json(new RouteResource($route));
    }
}
