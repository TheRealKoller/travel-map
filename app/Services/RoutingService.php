<?php

namespace App\Services;

use App\Enums\TransportMode;
use App\Models\Marker;
use Illuminate\Support\Facades\Http;

class RoutingService
{
    private const OSRM_BASE_URL = 'https://router.project-osrm.org';

    /**
     * Calculate route between two markers using OSRM.
     *
     * @return array{distance: int, duration: int, geometry: array}
     *
     * @throws \Exception
     */
    public function calculateRoute(
        Marker $startMarker,
        Marker $endMarker,
        TransportMode $transportMode = TransportMode::DrivingCar
    ): array {
        $profile = $this->getOsrmProfile($transportMode);

        $coordinates = sprintf(
            '%s,%s;%s,%s',
            $startMarker->lng,
            $startMarker->lat,
            $endMarker->lng,
            $endMarker->lat
        );

        $url = sprintf(
            '%s/route/v1/%s/%s',
            self::OSRM_BASE_URL,
            $profile,
            $coordinates
        );

        $response = Http::get($url, [
            'overview' => 'full',
            'geometries' => 'geojson',
        ]);

        if (! $response->successful()) {
            throw new \Exception('Failed to calculate route: '.$response->body());
        }

        $data = $response->json();

        if (! isset($data['routes'][0])) {
            throw new \Exception('No route found between the markers');
        }

        $route = $data['routes'][0];

        return [
            'distance' => (int) $route['distance'], // meters
            'duration' => (int) $route['duration'], // seconds
            'geometry' => $route['geometry']['coordinates'], // [[lng, lat], [lng, lat], ...]
        ];
    }

    /**
     * Get OSRM profile based on transport mode.
     * OSRM only supports: driving, cycling, foot
     */
    private function getOsrmProfile(TransportMode $mode): string
    {
        return match ($mode) {
            TransportMode::DrivingCar => 'driving',
            TransportMode::CyclingRegular => 'cycling',
            TransportMode::FootWalking => 'foot',
        };
    }
}
