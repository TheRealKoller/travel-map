<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MarkerEnrichmentAgentService;
use App\Services\TravelRecommendationAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeChatAgentController extends Controller
{
    public function __construct(
        private readonly MarkerEnrichmentAgentService $markerEnrichmentService,
        private readonly TravelRecommendationAgentService $travelRecommendationService,
    ) {}

    /**
     * Enrich marker information using Le Chat Agent.
     */
    public function enrichMarker(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->markerEnrichmentService->enrichMarkerInfo(
            $request->input('name'),
            $request->input('latitude'),
            $request->input('longitude')
        );

        if (! $result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get travel recommendations using Le Chat Agent.
     */
    public function getRecommendations(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'context' => 'required|string|in:trip,tour,map_view',
            'data' => 'required|array',
            'data.trip_name' => 'required|string',
            'data.markers' => 'required|array',
            'data.markers.*.name' => 'required|string',
            'data.markers.*.latitude' => 'required|numeric|between:-90,90',
            'data.markers.*.longitude' => 'required|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $context = $request->input('context');
        $data = $request->input('data');

        // Validate context-specific fields
        if ($context === 'tour' && ! isset($data['tour_name'])) {
            return response()->json([
                'success' => false,
                'error' => 'tour_name is required for tour context',
            ], 422);
        }

        if ($context === 'map_view' && ! isset($data['bounds'])) {
            return response()->json([
                'success' => false,
                'error' => 'bounds is required for map_view context',
            ], 422);
        }

        $result = $this->travelRecommendationService->getTravelRecommendations($context, $data);

        if (! $result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }
}
