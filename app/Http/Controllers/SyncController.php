<?php

namespace App\Http\Controllers;

use App\Http\Resources\RouteResource;
use App\Http\Resources\TourResource;
use App\Models\Trip;
use Carbon\Carbon;
use Carbon\Exceptions\InvalidFormatException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncController extends Controller
{
    use AuthorizesRequests;

    /**
     * Return all markers, routes, and tours that have been created or updated
     * since the given timestamp, along with IDs of soft-deleted items.
     *
     * Query param: since (ISO-8601 timestamp, required)
     */
    public function index(Request $request, Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        $sinceParam = $request->query('since');

        if (! $sinceParam) {
            return response()->json([
                'markers' => [],
                'routes' => [],
                'tours' => [],
                'deleted_marker_ids' => [],
                'deleted_route_ids' => [],
                'deleted_tour_ids' => [],
            ]);
        }

        try {
            // + is decoded as space in query strings; restore it before parsing
            $since = Carbon::parse(str_replace(' ', '+', $sinceParam));
        } catch (InvalidFormatException) {
            return response()->json(['error' => 'Invalid since timestamp.'], 422);
        }

        // Updated/new markers
        $markers = $trip->markers()
            ->where('updated_at', '>', $since)
            ->get();

        // Soft-deleted marker IDs since the given timestamp
        $deletedMarkerIds = $trip->markers()
            ->withTrashed()
            ->whereNotNull('deleted_at')
            ->where('deleted_at', '>', $since)
            ->pluck('id');

        // Updated/new routes
        $routes = $trip->routes()
            ->with(['startMarker', 'endMarker'])
            ->where('updated_at', '>', $since)
            ->get();

        // Soft-deleted route IDs since the given timestamp
        $deletedRouteIds = $trip->routes()
            ->withTrashed()
            ->whereNotNull('deleted_at')
            ->where('deleted_at', '>', $since)
            ->pluck('id');

        // Updated/new tours
        $tours = $trip->tours()
            ->with(['markers', 'routes'])
            ->where('updated_at', '>', $since)
            ->get();

        // Soft-deleted tour IDs since the given timestamp
        $deletedTourIds = $trip->tours()
            ->withTrashed()
            ->whereNotNull('deleted_at')
            ->where('deleted_at', '>', $since)
            ->pluck('id');

        return response()->json([
            'markers' => $markers,
            'routes' => RouteResource::collection($routes),
            'tours' => TourResource::collection($tours),
            'deleted_marker_ids' => $deletedMarkerIds,
            'deleted_route_ids' => $deletedRouteIds,
            'deleted_tour_ids' => $deletedTourIds,
        ]);
    }
}
