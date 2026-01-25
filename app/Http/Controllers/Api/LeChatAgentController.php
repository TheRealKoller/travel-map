<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MarkerEnrichmentAgentService;
use App\Services\TravelRecommendationAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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
            'language' => 'nullable|string|in:de,en',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $language = $request->input('language', $request->cookie('language', 'de'));

        $result = $this->markerEnrichmentService->enrichMarkerInfo(
            $request->input('name'),
            $request->input('latitude'),
            $request->input('longitude'),
            $language
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
            'language' => 'nullable|string|in:de,en',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $context = $request->input('context');
        $data = $request->input('data');
        $language = $request->input('language', $request->cookie('language', 'de'));

        // Validate context-specific fields
        if ($context === 'tour' && ! isset($data['tour_name'])) {
            throw new \App\Exceptions\BusinessLogicException('tour_name is required for tour context');
        }

        if ($context === 'map_view' && ! isset($data['bounds'])) {
            throw new \App\Exceptions\BusinessLogicException('bounds is required for map_view context');
        }

        $result = $this->travelRecommendationService->getTravelRecommendations($context, $data, $language);

        if (! $result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }
}
