<?php

namespace App\Services;

use App\Enums\PlaceType;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MapboxPlacesService
{
    private const MAPBOX_SEARCH_BASE_URL = 'https://api.mapbox.com/search/searchbox/v1';

    private const TIMEOUT_SECONDS = 30;

    public function __construct(
        private readonly string $accessToken
    ) {}

    /**
     * Search for points of interest within a radius of given coordinates.
     *
     * @param  float  $latitude  The latitude of the search center
     * @param  float  $longitude  The longitude of the search center
     * @param  int  $radiusKm  The search radius in kilometers
     * @param  PlaceType|null  $placeType  Optional place type to filter by
     * @return array{count: int, results: array<array{lat: float, lon: float, name?: string, name_en?: string, type?: string, address?: array}>, error: string|null}
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

            // Default to All if no place type specified
            $placeType = $placeType ?? PlaceType::All;

            Log::info('Mapbox Search API request', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'radius_km' => $radiusKm,
                'place_type' => $placeType->value,
            ]);

            // Get Mapbox categories for the place type
            $categories = $placeType->getMapboxCategories();

            $allResults = [];
            $failedCategories = 0;

            // Search for each category
            foreach ($categories as $category) {
                $categoryResults = $this->searchByCategory(
                    $category,
                    $latitude,
                    $longitude,
                    $radiusKm
                );

                if ($categoryResults !== null) {
                    // Use array spread operator for better performance
                    array_push($allResults, ...$categoryResults);
                } else {
                    $failedCategories++;
                }
            }

            // Remove duplicates based on coordinates (with small tolerance for floating point comparison)
            $uniqueResults = $this->removeDuplicateResults($allResults);

            $count = count($uniqueResults);

            // If all categories failed and we have no results, return an error
            if ($failedCategories === count($categories) && $count === 0) {
                Log::warning('All Mapbox category requests failed');

                return [
                    'count' => 0,
                    'results' => [],
                    'error' => 'Failed to fetch data from Mapbox Search API',
                ];
            }

            Log::info('Mapbox Search API response', [
                'count' => $count,
                'failed_categories' => $failedCategories,
            ]);

            return [
                'count' => $count,
                'results' => $uniqueResults,
                'error' => null,
            ];
        } catch (\Exception $e) {
            Log::error('Mapbox Search API exception', [
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
     * Search for places by category near coordinates.
     */
    private function searchByCategory(string $category, float $latitude, float $longitude, int $radiusKm): ?array
    {
        try {
            // Convert radius from km to meters
            $radiusMeters = $radiusKm * 1000;

            // Build the URL for category search
            $url = self::MAPBOX_SEARCH_BASE_URL."/category/{$category}";

            // Make request to Mapbox Search API
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->get($url, [
                    'access_token' => $this->accessToken,
                    'proximity' => "{$longitude},{$latitude}", // Mapbox uses lon,lat order
                    'limit' => 50, // Maximum results per category
                    'language' => 'en,de', // Support both English and German
                ]);

            if (! $response->successful()) {
                Log::warning('Mapbox Search API category request failed', [
                    'category' => $category,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $data = $response->json();
            $features = $data['features'] ?? [];

            $results = [];

            foreach ($features as $feature) {
                // Extract coordinates
                $coordinates = $feature['geometry']['coordinates'] ?? null;
                if (! $coordinates || count($coordinates) < 2) {
                    continue;
                }

                $lon = $coordinates[0];
                $lat = $coordinates[1];

                // Calculate distance to filter by radius
                $distance = $this->calculateDistance($latitude, $longitude, $lat, $lon);
                if ($distance > $radiusKm) {
                    continue;
                }

                $properties = $feature['properties'] ?? [];

                $result = [
                    'lat' => $lat,
                    'lon' => $lon,
                ];

                // Include name if available
                if (isset($properties['name'])) {
                    $result['name'] = $properties['name'];
                }

                // Include English name if available
                if (isset($properties['name_preferred'])) {
                    $result['name_en'] = $properties['name_preferred'];
                }

                // Include type/category information
                $placeType = $properties['poi_category'] ?? $properties['maki'] ?? $category;
                if ($placeType) {
                    $result['type'] = $placeType;
                }

                // Include full address if available
                if (isset($properties['full_address'])) {
                    $result['address'] = [
                        'formatted' => $properties['full_address'],
                    ];
                }

                // Parse address components if available
                $context = $properties['context'] ?? [];
                if (! empty($context)) {
                    $addressComponents = [];

                    foreach ($context as $component) {
                        $componentId = $component['id'] ?? '';

                        if (str_starts_with($componentId, 'postcode')) {
                            $addressComponents['postcode'] = $component['name'] ?? '';
                        } elseif (str_starts_with($componentId, 'place')) {
                            $addressComponents['city'] = $component['name'] ?? '';
                        } elseif (str_starts_with($componentId, 'region')) {
                            $addressComponents['region'] = $component['name'] ?? '';
                        } elseif (str_starts_with($componentId, 'country')) {
                            $addressComponents['country'] = $component['name'] ?? '';
                        }
                    }

                    if (! empty($addressComponents)) {
                        $result['address'] = array_merge($result['address'] ?? [], $addressComponents);
                    }
                }

                $results[] = $result;
            }

            return $results;
        } catch (\Exception $e) {
            Log::warning('Mapbox category search exception', [
                'category' => $category,
                'message' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Calculate distance between two coordinates in kilometers using Haversine formula.
     */
    private function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Remove duplicate results based on coordinates.
     */
    private function removeDuplicateResults(array $results): array
    {
        $unique = [];
        $seen = [];

        foreach ($results as $result) {
            // Create a key based on rounded coordinates (to handle floating point precision)
            $key = round($result['lat'], 5).'_'.round($result['lon'], 5);

            if (! isset($seen[$key])) {
                $seen[$key] = true;
                $unique[] = $result;
            }
        }

        return $unique;
    }
}
