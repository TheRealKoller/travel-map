<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OverpassService
{
    private const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

    private const TIMEOUT_SECONDS = 30;

    private const OVERPASS_QUERY_TIMEOUT = 25; // Timeout for Overpass query itself

    /**
     * Search for points of interest within a radius of given coordinates.
     *
     * @param  float  $latitude  The latitude of the search center
     * @param  float  $longitude  The longitude of the search center
     * @param  int  $radiusKm  The search radius in kilometers
     * @return array{count: int, error: string|null}
     */
    public function searchNearby(float $latitude, float $longitude, int $radiusKm): array
    {
        try {
            // Convert radius from km to meters
            $radiusMeters = $radiusKm * 1000;

            // Build Overpass QL query to find nodes with tags within radius
            // This searches for various common POI types (amenities, tourism, shops, etc.)
            $query = $this->buildOverpassQuery($latitude, $longitude, $radiusMeters);

            Log::info('Overpass API request', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'radius_km' => $radiusKm,
            ]);

            // Make request to Overpass API
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->asForm()
                ->post(self::OVERPASS_API_URL, [
                    'data' => $query,
                ]);

            if (! $response->successful()) {
                Log::error('Overpass API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'count' => 0,
                    'error' => 'Failed to fetch data from Overpass API',
                ];
            }

            $data = $response->json();

            // Count the elements returned
            $count = isset($data['elements']) ? count($data['elements']) : 0;

            Log::info('Overpass API response', [
                'count' => $count,
            ]);

            return [
                'count' => $count,
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('Overpass API exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'count' => 0,
                'error' => 'An error occurred while searching: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Build Overpass QL query for searching POIs.
     */
    private function buildOverpassQuery(float $latitude, float $longitude, int $radiusMeters): string
    {
        // Search for various types of POIs:
        // - amenity (restaurants, cafes, hotels, etc.)
        // - tourism (museums, viewpoints, attractions, etc.)
        // - shop (various shops)
        // - historic (monuments, ruins, etc.)
        // - leisure (parks, playgrounds, etc.)
        //
        // Using the "around" filter for radius search
        // Output format: json, with count of results
        $timeoutSeconds = self::OVERPASS_QUERY_TIMEOUT;
        $query = <<<OVERPASS
[out:json][timeout:{$timeoutSeconds}];
(
  node["amenity"](around:{$radiusMeters},{$latitude},{$longitude});
  node["tourism"](around:{$radiusMeters},{$latitude},{$longitude});
  node["shop"](around:{$radiusMeters},{$latitude},{$longitude});
  node["historic"](around:{$radiusMeters},{$latitude},{$longitude});
  node["leisure"](around:{$radiusMeters},{$latitude},{$longitude});
);
out center;
OVERPASS;

        return $query;
    }
}
