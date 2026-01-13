<?php

namespace App\Services;

use App\Enums\TransportMode;
use App\Exceptions\MapboxQuotaExceededException;
use App\Exceptions\RouteNotFoundException;
use App\Exceptions\RoutingProviderException;
use App\Models\Marker;
use Illuminate\Support\Facades\Http;

class RoutingService
{
    private const MAPBOX_BASE_URL = 'https://api.mapbox.com';

    private const GOOGLE_DIRECTIONS_BASE_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';

    public function __construct(
        private readonly MapboxRequestLimiter $limiter = new MapboxRequestLimiter
    ) {}

    /**
     * Calculate route between two markers using Mapbox Directions API.
     *
     * @return array{distance: int, duration: int, geometry: array, warning: string|null}
     *
     * @throws RouteNotFoundException
     * @throws RoutingProviderException
     * @throws MapboxQuotaExceededException
     */
    public function calculateRoute(
        Marker $startMarker,
        Marker $endMarker,
        TransportMode $transportMode = TransportMode::DrivingCar
    ): array {
        // Use Google Transit API for public transport
        if ($transportMode === TransportMode::PublicTransport) {
            return $this->calculateTransitRoute($startMarker, $endMarker);
        }

        // Use Mapbox for other transport modes
        return $this->calculateMapboxRoute($startMarker, $endMarker, $transportMode);
    }

    /**
     * Calculate route using Google Routes API v2 for public transport.
     *
     * @return array{distance: int, duration: int, geometry: array, transit_details: array|null, alternatives: array|null, warning: string|null}
     *
     * @throws RouteNotFoundException
     * @throws RoutingProviderException
     */
    private function calculateTransitRoute(
        Marker $startMarker,
        Marker $endMarker,
        ?int $departureTime = null,
        bool $includeAlternatives = true
    ): array {
        $apiKey = config('services.google_maps.api_key');

        if (! $apiKey) {
            throw new RoutingProviderException('Google Maps API key not configured. Please add GOOGLE_MAPS_API_KEY to your .env file.');
        }

        // Build request body for Google Routes API v2
        $requestBody = [
            'origin' => [
                'location' => [
                    'latLng' => [
                        'latitude' => $startMarker->latitude,
                        'longitude' => $startMarker->longitude,
                    ],
                ],
            ],
            'destination' => [
                'location' => [
                    'latLng' => [
                        'latitude' => $endMarker->latitude,
                        'longitude' => $endMarker->longitude,
                    ],
                ],
            ],
            'travelMode' => 'TRANSIT',
            'computeAlternativeRoutes' => $includeAlternatives,
            'languageCode' => 'en-US',
            'units' => 'METRIC',
        ];

        // Add departure time if provided
        if ($departureTime) {
            $requestBody['transitPreferences'] = [
                'departureTime' => gmdate('Y-m-d\TH:i:s\Z', $departureTime),
            ];
        }

        $response = Http::withHeaders([
            'Referer' => config('app.url'),
            'X-Goog-Api-Key' => $apiKey,
            'X-Goog-FieldMask' => 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps,routes.legs.localizedValues',
        ])->post(self::GOOGLE_DIRECTIONS_BASE_URL, $requestBody);

        if (! $response->successful()) {
            throw new RoutingProviderException('Failed to calculate transit route via Google Maps: '.$response->body());
        }

        $data = $response->json();

        if (empty($data['routes'])) {
            throw new RouteNotFoundException('No public transport route found between the markers');
        }

        // Get the primary route
        $primaryRoute = $data['routes'][0];

        // Extract geometry
        $geometry = $this->decodePolyline($primaryRoute['polyline']['encodedPolyline']);

        // Extract distance and duration
        $distance = (int) $primaryRoute['distanceMeters'];
        $duration = (int) rtrim($primaryRoute['duration'], 's'); // Remove 's' suffix

        // Extract detailed transit information
        $transitDetails = null;
        $alternatives = null;

        if (isset($primaryRoute['legs'][0])) {
            $leg = $primaryRoute['legs'][0];
            $transitDetails = $this->extractTransitDetailsV2($leg);

            // Extract alternative routes if available
            if ($includeAlternatives && count($data['routes']) > 1) {
                $alternatives = $this->extractAlternativeRoutesV2(array_slice($data['routes'], 1));
            }
        }

        return [
            'distance' => $distance,
            'duration' => $duration,
            'geometry' => $geometry,
            'transit_details' => $transitDetails,
            'alternatives' => $alternatives,
            'warning' => null,
        ];
    }

    /**
     * Calculate route using Mapbox Directions API.
     *
     * @return array{distance: int, duration: int, geometry: array, transit_details: null, alternatives: null, warning: string|null}
     *
     * @throws RouteNotFoundException
     * @throws RoutingProviderException
     * @throws MapboxQuotaExceededException
     */
    private function calculateMapboxRoute(
        Marker $startMarker,
        Marker $endMarker,
        TransportMode $transportMode
    ): array {
        // Check quota before making request
        $this->limiter->checkQuota();

        $accessToken = config('services.mapbox.access_token');

        if (! $accessToken) {
            throw new RoutingProviderException('Mapbox access token not configured. Please add MAPBOX_ACCESS_TOKEN to your .env file.');
        }

        $profile = $this->getMapboxProfile($transportMode);

        $coordinates = sprintf(
            '%s,%s;%s,%s',
            $startMarker->longitude,
            $startMarker->latitude,
            $endMarker->longitude,
            $endMarker->latitude
        );

        $url = sprintf(
            '%s/directions/v5/mapbox/%s/%s',
            self::MAPBOX_BASE_URL,
            $profile,
            $coordinates
        );

        $response = Http::get($url, [
            'access_token' => $accessToken,
            'overview' => 'full',
            'geometries' => 'geojson',
        ]);

        // Increment the request counter for successful API call
        $this->limiter->incrementCount();

        if (! $response->successful()) {
            throw new RoutingProviderException('Failed to calculate route via Mapbox: '.$response->body());
        }

        $data = $response->json();

        if (! isset($data['routes'][0])) {
            throw new RouteNotFoundException('No route found between the markers');
        }

        $route = $data['routes'][0];
        $distance = (int) $route['distance']; // meters
        $duration = (int) $route['duration']; // seconds

        // Check for unrealistic routes (except for public transport)
        $warning = $transportMode === TransportMode::PublicTransport
            ? null
            : $this->checkRouteRealism($distance, $duration, $transportMode);

        return [
            'distance' => $distance,
            'duration' => $duration,
            'geometry' => $route['geometry']['coordinates'], // [[lng, lat], [lng, lat], ...]
            'transit_details' => null,
            'alternatives' => null,
            'warning' => $warning,
        ];
    }

    /**
     * Extract detailed transit information from Google Routes API v2 leg.
     */
    private function extractTransitDetailsV2(array $leg): array
    {
        $steps = [];

        if (isset($leg['steps'])) {
            foreach ($leg['steps'] as $step) {
                $stepData = [
                    'travel_mode' => $step['travelMode'] ?? 'UNKNOWN',
                    'distance' => isset($step['distanceMeters']) ? (int) $step['distanceMeters'] : 0,
                    'duration' => isset($step['staticDuration']) ? (int) rtrim($step['staticDuration'], 's') : 0,
                ];

                // Add transit-specific details
                if (isset($step['transitDetails'])) {
                    $transit = $step['transitDetails'];

                    $stepData['transit'] = [
                        'departure_stop' => [
                            'name' => $transit['stopDetails']['departureStop']['name'] ?? null,
                            'location' => $transit['stopDetails']['departureStop']['location'] ?? null,
                        ],
                        'arrival_stop' => [
                            'name' => $transit['stopDetails']['arrivalStop']['name'] ?? null,
                            'location' => $transit['stopDetails']['arrivalStop']['location'] ?? null,
                        ],
                        'line' => [
                            'name' => $transit['transitLine']['name'] ?? null,
                            'short_name' => $transit['transitLine']['nameShort'] ?? null,
                            'color' => $transit['transitLine']['color'] ?? null,
                            'vehicle_type' => $transit['transitLine']['vehicle']['name']['text'] ?? null,
                        ],
                        'departure_time' => isset($transit['stopDetails']['departureTime'])
                            ? strtotime($transit['stopDetails']['departureTime'])
                            : null,
                        'arrival_time' => isset($transit['stopDetails']['arrivalTime'])
                            ? strtotime($transit['stopDetails']['arrivalTime'])
                            : null,
                        'num_stops' => $transit['stopCount'] ?? 0,
                        'headsign' => $transit['headsign'] ?? null,
                    ];
                }

                $steps[] = $stepData;
            }
        }

        return [
            'steps' => $steps,
            'departure_time' => isset($leg['localizedValues']['departure']['time']['text'])
                ? $leg['localizedValues']['departure']['time']['text']
                : null,
            'arrival_time' => isset($leg['localizedValues']['arrival']['time']['text'])
                ? $leg['localizedValues']['arrival']['time']['text']
                : null,
            'start_address' => $leg['startLocation']['address'] ?? null,
            'end_address' => $leg['endLocation']['address'] ?? null,
        ];
    }

    /**
     * Extract alternative routes information from Google Routes API v2.
     */
    private function extractAlternativeRoutesV2(array $routes): array
    {
        return array_map(function ($route) {
            $distance = (int) $route['distanceMeters'];
            $duration = (int) rtrim($route['duration'], 's');

            $numTransfers = 0;
            if (isset($route['legs'][0]['steps'])) {
                $transitSteps = array_filter(
                    $route['legs'][0]['steps'],
                    fn ($step) => ($step['travelMode'] ?? '') === 'TRANSIT'
                );
                $numTransfers = max(0, count($transitSteps) - 1);
            }

            return [
                'distance' => $distance,
                'duration' => $duration,
                'num_transfers' => $numTransfers,
            ];
        }, $routes);
    }

    /**
     * Decode Google polyline string to coordinates array.
     *
     * @return array<int, array{0: float, 1: float}>
     */
    private function decodePolyline(string $encoded): array
    {
        $coordinates = [];
        $index = 0;
        $lat = 0;
        $lng = 0;
        $len = strlen($encoded);

        while ($index < $len) {
            // Decode latitude
            $b = 0;
            $shift = 0;
            $result = 0;

            do {
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1F) << $shift;
                $shift += 5;
            } while ($b >= 0x20);

            $dlat = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lat += $dlat;

            // Decode longitude
            $shift = 0;
            $result = 0;

            do {
                $b = ord($encoded[$index++]) - 63;
                $result |= ($b & 0x1F) << $shift;
                $shift += 5;
            } while ($b >= 0x20);

            $dlng = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lng += $dlng;

            // Store as [longitude, latitude] for GeoJSON compatibility
            $coordinates[] = [
                $lng / 1e5,
                $lat / 1e5,
            ];
        }

        return $coordinates;
    }

    /**
     * Check if route is realistic based on distance, duration and transport mode.
     */
    private function checkRouteRealism(int $distanceMeters, int $durationSeconds, TransportMode $mode): ?string
    {
        $distanceKm = $distanceMeters / 1000;
        $durationHours = $durationSeconds / 3600;

        // Calculate average speed in km/h
        $avgSpeed = $durationHours > 0 ? $distanceKm / $durationHours : 0;

        $warnings = [];

        // Check based on transport mode
        switch ($mode) {
            case TransportMode::FootWalking:
                // Normal walking speed: 4-6 km/h
                // Distance warnings
                if ($distanceKm > 50) {
                    $warnings[] = "This walking route is very long ({$distanceKm} km). Consider using bicycle or car instead.";
                } elseif ($distanceKm > 30) {
                    $warnings[] = "This is a long walking route ({$distanceKm} km). Make sure you're prepared for a multi-hour walk.";
                }

                // Speed warnings (unrealistic if over 8 km/h average)
                if ($avgSpeed > 8) {
                    $warnings[] = 'The calculated duration seems unrealistic for walking routes.';
                }
                break;

            case TransportMode::CyclingRegular:
                // Normal cycling speed: 15-25 km/h
                if ($distanceKm > 200) {
                    $warnings[] = "This is a very long cycling route ({$distanceKm} km). Consider breaking it into multiple days.";
                } elseif ($distanceKm > 100) {
                    $warnings[] = "This is a long cycling route ({$distanceKm} km). Plan for rest stops and sufficient time.";
                }

                // Speed warnings (unrealistic if over 40 km/h average)
                if ($avgSpeed > 40) {
                    $warnings[] = 'The calculated duration seems unrealistic for cycling.';
                }
                break;

            case TransportMode::DrivingCar:
                // Normal driving speed varies greatly, but average over 150 km/h is unrealistic
                if ($avgSpeed > 150) {
                    $warnings[] = 'The calculated duration seems unrealistic for driving.';
                }
                break;
        }

        return empty($warnings) ? null : implode(' ', $warnings);
    }

    /**
     * Get Mapbox routing profile based on transport mode.
     * Mapbox supports: driving-traffic, driving, walking, cycling
     */
    private function getMapboxProfile(TransportMode $mode): string
    {
        return match ($mode) {
            TransportMode::DrivingCar => 'driving-traffic',
            TransportMode::CyclingRegular => 'cycling',
            TransportMode::FootWalking => 'walking',
            TransportMode::PublicTransport => 'driving-traffic', // Should not be reached anymore
        };
    }
}
