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

            // Extract elements with their coordinates, filtering out invalid ones
            $elements = $data['elements'] ?? [];
            $results = [];

            foreach ($elements as $element) {
                // Prefer direct lat/lon, fallback to center coordinates
                $lat = $element['lat'] ?? $element['center']['lat'] ?? null;
                $lon = $element['lon'] ?? $element['center']['lon'] ?? null;

                // Skip elements without valid coordinates
                if ($lat === null || $lon === null) {
                    Log::warning('Skipping element without coordinates', ['element_id' => $element['id'] ?? 'unknown']);

                    continue;
                }

                $result = [
                    'lat' => $lat,
                    'lon' => $lon,
                ];

                $tags = $element['tags'] ?? [];

                // Include name if available
                if (isset($tags['name'])) {
                    $result['name'] = $tags['name'];
                }

                // Include English name if available
                if (isset($tags['name:en'])) {
                    $result['name_en'] = $tags['name:en'];
                }

                // Include international name if available
                if (isset($tags['int_name'])) {
                    $result['name_int'] = $tags['int_name'];
                }

                // Include type information if available
                if (isset($tags['amenity'])) {
                    $result['type'] = $tags['amenity'];
                } elseif (isset($tags['tourism'])) {
                    $result['type'] = $tags['tourism'];
                } elseif (isset($tags['shop'])) {
                    $result['type'] = $tags['shop'];
                }

                // Include website if available
                if (isset($tags['website'])) {
                    $result['website'] = $tags['website'];
                }

                // Include description if available
                if (isset($tags['description'])) {
                    $result['description'] = $tags['description'];
                }

                // Include entry fee if available
                if (isset($tags['fee'])) {
                    $result['fee'] = $tags['fee'];
                }

                // Include opening hours if available
                if (isset($tags['opening_hours'])) {
                    $result['opening_hours'] = $tags['opening_hours'];
                }

                // Build address if any address components are available
                $address = [];
                if (isset($tags['addr:street'])) {
                    $address['street'] = $tags['addr:street'];
                }
                if (isset($tags['addr:housenumber'])) {
                    $address['housenumber'] = $tags['addr:housenumber'];
                }
                if (isset($tags['addr:postcode'])) {
                    $address['postcode'] = $tags['addr:postcode'];
                }
                if (isset($tags['addr:city'])) {
                    $address['city'] = $tags['addr:city'];
                }
                if (isset($tags['addr:country'])) {
                    $address['country'] = $tags['addr:country'];
                }
                if (!empty($address)) {
                    $result['address'] = $address;
                }

                $results[] = $result;
            }

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
