<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LeChatAgentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeChatAgentController extends Controller
{
    public function __construct(
        private readonly LeChatAgentService $leChatService,
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

        $result = $this->leChatService->enrichMarkerInfo(
            $request->input('name'),
            $request->input('latitude'),
            $request->input('longitude')
        );

        if (! $result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result);
    }
}
