<?php

namespace App\Services;

use App\Enums\PlaceType;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OverpassService
{
    private const OVERPASS_API_URL = 'https://overpass.private.coffee/api/interpreter';

    private const TIMEOUT_SECONDS = 30;

    private const OVERPASS_QUERY_TIMEOUT = 25; // Timeout for Overpass query itself

    /**
     * Search for points of interest within a radius of given coordinates.
     *
     * @param  float  $latitude  The latitude of the search center
     * @param  float  $longitude  The longitude of the search center
     * @param  int  $radiusKm  The search radius in kilometers
     * @param  PlaceType|null  $placeType  Optional place type to filter by
     * @return array{count: int, results: array<array{lat: float, lon: float, name?: string, type?: string}>, error: string|null}
     */
    public function searchNearby(float $latitude, float $longitude, int $radiusKm, ?PlaceType $placeType = null): array
    {
        try {
            // Additional validation for defense in depth
            if ($latitude < -90 || $latitude > 90) {
                throw new \InvalidArgumentException('Latitude must be between -90 and 90');
            }
            if ($longitude < -180 || $longitude > 180) {
                throw new \InvalidArgumentException('Longitude must be between -180 and 180');
            }
            if ($radiusKm < 1 || $radiusKm > 100) {
                throw new \InvalidArgumentException('Radius must be between 1 and 100 km');
            }

            // Convert radius from km to meters
            $radiusMeters = $radiusKm * 1000;

            // Build Overpass QL query to find nodes with tags within radius
            // This searches for various common POI types (amenities, tourism, shops, etc.)
            $query = $this->buildOverpassQuery($latitude, $longitude, $radiusMeters, $placeType);

            Log::info('Overpass API request', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'radius_km' => $radiusKm,
                'place_type' => $placeType?->value,
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
                    'results' => [],
                    'error' => 'Failed to fetch data from Overpass API',
                ];
            }

            $data = $response->json();

            // Extract elements with their coordinates
            $elements = $data['elements'] ?? [];
            $results = array_map(function ($element) {
                // Prefer direct lat/lon, fallback to center coordinates
                $lat = $element['lat'] ?? $element['center']['lat'] ?? null;
                $lon = $element['lon'] ?? $element['center']['lon'] ?? null;

                // Skip elements without valid coordinates
                if ($lat === null || $lon === null) {
                    Log::warning('Skipping element without coordinates', ['element_id' => $element['id'] ?? 'unknown']);

                    return null;
                }

                $result = [
                    'lat' => $lat,
                    'lon' => $lon,
                ];

                // Include name if available
                if (isset($element['tags']['name'])) {
                    $result['name'] = $element['tags']['name'];
                }

                // Include type information if available
                if (isset($element['tags']['amenity'])) {
                    $result['type'] = $element['tags']['amenity'];
                } elseif (isset($element['tags']['tourism'])) {
                    $result['type'] = $element['tags']['tourism'];
                } elseif (isset($element['tags']['shop'])) {
                    $result['type'] = $element['tags']['shop'];
                }

                return $result;
            }, $elements);

            // Filter out null values (elements without coordinates)
            $results = array_values(array_filter($results, fn ($result) => $result !== null));

            $count = count($results);

            Log::info('Overpass API response', [
                'count' => $count,
            ]);

            return [
                'count' => $count,
                'results' => $results,
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('Overpass API exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'count' => 0,
                'results' => [],
                'error' => 'An error occurred while searching nearby locations. Please try again.',
            ];
        }
    }

    /**
     * Build Overpass QL query for searching POIs.
     */
    private function buildOverpassQuery(float $latitude, float $longitude, int $radiusMeters, ?PlaceType $placeType = null): string
    {
        $timeoutSeconds = self::OVERPASS_QUERY_TIMEOUT;

        // If no place type is specified, use default broad search
        $placeType = $placeType ?? PlaceType::All;

        // Get the conditions for the selected place type
        $conditions = $placeType->getOverpassConditions();

        // Build the query lines with around filter
        $queryLines = array_map(
            fn ($condition) => "  {$condition}(around:{$radiusMeters},{$latitude},{$longitude});",
            $conditions
        );

        $queryBody = implode("\n", $queryLines);

        $query = <<<OVERPASS
[out:json][timeout:{$timeoutSeconds}];
(
{$queryBody}
);
out center;
OVERPASS;

        return $query;
    }
}
