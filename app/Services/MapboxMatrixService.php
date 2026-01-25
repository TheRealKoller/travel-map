<?php

namespace App\Services;

use App\Exceptions\MapboxQuotaExceededException;
use App\Exceptions\RoutingProviderException;
use App\Models\Marker;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MapboxMatrixService
{
    private const MAPBOX_BASE_URL = 'https://api.mapbox.com';

    private const MAX_LOCATIONS = 25; // Mapbox Matrix API limit

    public function __construct(
        private readonly MapboxRequestLimiter $limiter = new MapboxRequestLimiter
    ) {}

    /**
     * Calculate distance and duration matrix between markers using Mapbox Matrix API.
     * Uses walking profile as specified in requirements.
     *
     * @param  array<Marker>  $markers  Array of markers to calculate matrix for
     * @return array{durations: array<array<float|null>>, distances: array<array<float|null>>} Matrix of durations (seconds) and distances (meters)
     *
     * @throws RoutingProviderException
     * @throws MapboxQuotaExceededException
     */
    public function calculateMatrix(array $markers): array
    {
        $markerCount = count($markers);

        if ($markerCount < 2) {
            throw new \InvalidArgumentException('At least 2 markers are required to calculate a matrix');
        }

        if ($markerCount > self::MAX_LOCATIONS) {
            throw new \InvalidArgumentException(sprintf(
                'Too many markers. Maximum is %d markers for Mapbox Matrix API',
                self::MAX_LOCATIONS
            ));
        }

        // Check quota before making request
        $this->limiter->checkQuota();

        $accessToken = config('services.mapbox.access_token');

        if (! $accessToken) {
            throw new RoutingProviderException('Mapbox access token not configured. Please add MAPBOX_ACCESS_TOKEN to your .env file.');
        }

        // Build coordinates string for Mapbox API
        // Format: "longitude,latitude;longitude,latitude;..."
        $coordinates = collect($markers)
            ->map(fn (Marker $marker) => "{$marker->longitude},{$marker->latitude}")
            ->join(';');

        // Use walking profile as per requirements (foot-walking = walking)
        $profile = 'walking';

        $url = sprintf(
            '%s/directions-matrix/v1/mapbox/%s/%s',
            self::MAPBOX_BASE_URL,
            $profile,
            $coordinates
        );

        Log::info('Calling Mapbox Matrix API', [
            'marker_count' => $markerCount,
            'profile' => $profile,
        ]);

        $response = Http::get($url, [
            'access_token' => $accessToken,
            'sources' => 'all', // Use all locations as sources
            'destinations' => 'all', // Use all locations as destinations
            'annotations' => 'duration,distance', // Get both duration and distance
        ]);

        // Increment the request counter for successful API call
        $this->limiter->incrementCount();

        if (! $response->successful()) {
            Log::error('Mapbox Matrix API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            throw new RoutingProviderException('Failed to calculate matrix via Mapbox: '.$response->body());
        }

        $data = $response->json();

        if (! isset($data['durations']) || ! isset($data['distances'])) {
            throw new RoutingProviderException('Invalid response from Mapbox Matrix API: missing durations or distances');
        }

        return [
            'durations' => $data['durations'], // Matrix of durations in seconds (null if no route)
            'distances' => $data['distances'], // Matrix of distances in meters (null if no route)
        ];
    }
}
