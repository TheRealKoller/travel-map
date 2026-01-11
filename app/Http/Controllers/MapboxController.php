<?php

namespace App\Http\Controllers;

use App\Services\MapboxRequestLimiter;
use Illuminate\Http\JsonResponse;

class MapboxController extends Controller
{
    public function __construct(
        private readonly MapboxRequestLimiter $limiter
    ) {}

    /**
     * Get current Mapbox API usage statistics.
     */
    public function usage(): JsonResponse
    {
        $stats = $this->limiter->getUsageStats();

        return response()->json($stats);
    }
}
