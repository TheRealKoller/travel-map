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
     * @return array{distance: int, duration: int, geometry: array, warning: string|null}
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
            $startMarker->longitude,
            $startMarker->latitude,
            $endMarker->longitude,
            $endMarker->latitude
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
        $distance = (int) $route['distance']; // meters
        $duration = (int) $route['duration']; // seconds

        // Check for unrealistic routes
        $warning = $this->checkRouteRealism($distance, $duration, $transportMode);

        return [
            'distance' => $distance,
            'duration' => $duration,
            'geometry' => $route['geometry']['coordinates'], // [[lng, lat], [lng, lat], ...]
            'warning' => $warning,
        ];
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
                    $warnings[] = "The calculated duration seems unrealistic. OSRM's walking routes are optimized for short urban distances, not long-distance travel.";
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
