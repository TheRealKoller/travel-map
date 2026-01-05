<?php

namespace App\Services;

use App\Enums\PlaceType;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MapboxGeocodingService
{
    private const MAPBOX_BASE_URL = 'https://api.mapbox.com';

    private const TIMEOUT_SECONDS = 30;

    /**
     * Search for points of interest within a radius of given coordinates.
     *
     * @param  float  $latitude  The latitude of the search center
     * @param  float  $longitude  The longitude of the search center
     * @param  int  $radiusKm  The search radius in kilometers
     * @param  PlaceType|null  $placeType  Optional place type to filter by
     * @return array{count: int, results: array<array{lat: float, lon: float, name?: string, name_en?: string, name_int?: string, type?: string, website?: string, description?: string, fee?: string, opening_hours?: string, address?: array}>, error: string|null}
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

            $accessToken = config('services.mapbox.access_token');

            if (! $accessToken) {
                Log::error('Mapbox access token not configured');

                return [
                    'count' => 0,
                    'results' => [],
                    'error' => 'Mapbox access token not configured. Please add MAPBOX_ACCESS_TOKEN to your .env file.',
                ];
            }

            // Convert radius from km to meters for Mapbox (max 50km = 50000m)
            $radiusMeters = min($radiusKm * 1000, 50000);

            // Get Mapbox category types based on place type
            $types = $this->getMapboxTypes($placeType);

            Log::info('Mapbox Geocoding API request', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'radius_km' => $radiusKm,
                'place_type' => $placeType?->value,
                'types' => $types,
            ]);

            // Mapbox Geocoding API - using forward geocoding with proximity bias
            $url = sprintf(
                '%s/geocoding/v5/mapbox.places/.json',
                self::MAPBOX_BASE_URL
            );

            $params = [
                'access_token' => $accessToken,
                'proximity' => "{$longitude},{$latitude}",
                'limit' => 10, // Maximum results per request
                'types' => $types,
                'bbox' => $this->calculateBoundingBox($latitude, $longitude, $radiusKm),
            ];

            $response = Http::timeout(self::TIMEOUT_SECONDS)->get($url, $params);

            if (! $response->successful()) {
                Log::error('Mapbox Geocoding API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [
                    'count' => 0,
                    'results' => [],
                    'error' => 'Failed to fetch data from Mapbox Geocoding API',
                ];
            }

            $data = $response->json();

            // Extract features from response
            $features = $data['features'] ?? [];
            $results = [];

            foreach ($features as $feature) {
                $geometry = $feature['geometry'] ?? null;
                $coordinates = $geometry['coordinates'] ?? null;

                // Skip elements without valid coordinates
                if (! $coordinates || count($coordinates) < 2) {
                    Log::warning('Skipping feature without coordinates', ['feature_id' => $feature['id'] ?? 'unknown']);

                    continue;
                }

                [$lon, $lat] = $coordinates;

                // Check if result is within radius (Mapbox bbox is approximate)
                $distance = $this->calculateDistance($latitude, $longitude, $lat, $lon);
                if ($distance > $radiusKm) {
                    continue;
                }

                $properties = $feature['properties'] ?? [];
                $placeName = $feature['place_name'] ?? $feature['text'] ?? null;

                $result = [
                    'lat' => $lat,
                    'lon' => $lon,
                ];

                // Include name if available
                if ($placeName) {
                    $result['name'] = $placeName;
                }

                // Extract place type from context or category
                $placeCategory = $properties['category'] ?? null;
                if ($placeCategory) {
                    $result['type'] = is_array($placeCategory) ? $placeCategory[0] : $placeCategory;
                }

                // Include address if available
                if (isset($properties['address'])) {
                    $result['address'] = ['street' => $properties['address']];
                }

                $results[] = $result;
            }

            $count = count($results);

            Log::info('Mapbox Geocoding API response', [
                'count' => $count,
            ]);

            return [
                'count' => $count,
                'results' => $results,
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('Mapbox Geocoding API exception', [
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
     * Get Mapbox place types based on PlaceType enum.
     * Mapbox types: country, region, postcode, district, place, locality, neighborhood, address, poi
     */
    private function getMapboxTypes(?PlaceType $placeType = null): string
    {
        // Default to POI (points of interest) for most searches
        if ($placeType === null || $placeType === PlaceType::All) {
            return 'poi';
        }

        // For specific place types, still use poi but we can filter by category later
        // Mapbox doesn't have as granular type filtering as Overpass
        return 'poi';
    }

    /**
     * Calculate bounding box for search area.
     * Returns string in format: "min_lon,min_lat,max_lon,max_lat"
     */
    private function calculateBoundingBox(float $latitude, float $longitude, int $radiusKm): string
    {
        // Approximate degrees per km (varies by latitude)
        $latDegreesPerKm = 1 / 110.574;
        $lonDegreesPerKm = 1 / (111.320 * cos(deg2rad($latitude)));

        $latDelta = $radiusKm * $latDegreesPerKm;
        $lonDelta = $radiusKm * $lonDegreesPerKm;

        $minLon = $longitude - $lonDelta;
        $maxLon = $longitude + $lonDelta;
        $minLat = $latitude - $latDelta;
        $maxLat = $latitude + $latDelta;

        return "{$minLon},{$minLat},{$maxLon},{$maxLat}";
    }

    /**
     * Calculate distance between two points using Haversine formula.
     * Returns distance in kilometers.
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
