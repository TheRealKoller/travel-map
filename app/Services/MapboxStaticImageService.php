<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MapboxStaticImageService
{
    private const MAPBOX_STATIC_IMAGE_BASE_URL = 'https://api.mapbox.com/styles/v1';

    public function __construct(
        private readonly ?string $accessToken = null
    ) {}

    /**
     * Generate a static image URL for a map viewport.
     * Uses the custom style matching the viewport picker (the-koller/cmkk2r7cg00gl01r15b1achfj).
     *
     * @param  float  $latitude  The latitude of the map center
     * @param  float  $longitude  The longitude of the map center
     * @param  float  $zoom  The zoom level
     * @param  int  $width  The image width in pixels (max 1280)
     * @param  int  $height  The image height in pixels (max 1280)
     * @return string|null The static image URL or null if access token is missing
     */
    public function generateStaticImageUrl(
        float $latitude,
        float $longitude,
        float $zoom,
        int $width = 800,
        int $height = 400
    ): ?string {
        // Return null if no access token is configured
        if (empty($this->accessToken)) {
            Log::warning('Mapbox Static Image API called without access token configured');

            return null;
        }

        // Validate parameters
        if ($latitude < -90 || $latitude > 90) {
            throw new \InvalidArgumentException('Latitude must be between -90 and 90');
        }
        if ($longitude < -180 || $longitude > 180) {
            throw new \InvalidArgumentException('Longitude must be between -180 and 180');
        }
        if ($zoom < 0 || $zoom > 22) {
            throw new \InvalidArgumentException('Zoom must be between 0 and 22');
        }
        if ($width < 1 || $width > 1280) {
            throw new \InvalidArgumentException('Width must be between 1 and 1280');
        }
        if ($height < 1 || $height > 1280) {
            throw new \InvalidArgumentException('Height must be between 1 and 1280');
        }

        // Use custom style to match the viewport picker
        $style = 'the-koller/cmkk2r7cg00gl01r15b1achfj';

        // Format: /styles/v1/{username}/{style_id}/static/{longitude},{latitude},{zoom},{bearing},{pitch}/{width}x{height}{@2x}
        // We use default bearing (0) and pitch (0)
        $url = sprintf(
            '%s/%s/static/%s,%s,%s,0,0/%dx%d?access_token=%s',
            self::MAPBOX_STATIC_IMAGE_BASE_URL,
            $style,
            $longitude, // Mapbox uses longitude,latitude order
            $latitude,
            $zoom,
            $width,
            $height,
            $this->accessToken
        );

        return $url;
    }

    /**
     * Generate a static image URL for a map with marker overlays.
     * Automatically calculates the bounding box and zoom level to fit all markers.
     *
     * @param  array  $markers  Array of markers with 'latitude' and 'longitude' keys
     * @param  int  $width  The image width in pixels (max 1280)
     * @param  int  $height  The image height in pixels (max 1280)
     * @param  int  $padding  Padding around the bounding box in pixels (default 50)
     * @return string|null The static image URL or null if access token is missing or no markers
     */
    public function generateStaticImageWithMarkers(
        array $markers,
        int $width = 800,
        int $height = 600,
        int $padding = 50
    ): ?string {
        // Return null if no access token is configured
        if (empty($this->accessToken)) {
            Log::warning('Mapbox Static Image API called without access token configured');

            return null;
        }

        // Return null if no markers
        if (empty($markers)) {
            Log::info('Cannot generate static image without markers');

            return null;
        }

        // Validate dimensions
        if ($width < 1 || $width > 1280) {
            throw new \InvalidArgumentException('Width must be between 1 and 1280');
        }
        if ($height < 1 || $height > 1280) {
            throw new \InvalidArgumentException('Height must be between 1 and 1280');
        }

        // Use custom style to match the viewport picker
        $style = 'the-koller/cmkk2r7cg00gl01r15b1achfj';

        // Build marker overlays string
        $overlays = $this->buildMarkerOverlays($markers);

        // Format: /styles/v1/{username}/{style_id}/static/{overlay}/{position}/{width}x{height}
        // Using 'auto' position to automatically fit all markers
        $url = sprintf(
            '%s/%s/static/%s/auto/%dx%d?access_token=%s&padding=%d',
            self::MAPBOX_STATIC_IMAGE_BASE_URL,
            $style,
            $overlays,
            $width,
            $height,
            $this->accessToken,
            $padding
        );

        return $url;
    }

    /**
     * Generate a static image URL for a tour map with markers and route paths.
     * Automatically calculates the bounding box and zoom level to fit all markers and routes.
     *
     * @param  array  $markers  Array of markers with 'latitude' and 'longitude' keys
     * @param  array  $routes  Array of routes with 'geometry' key (array of [lng, lat] coordinates)
     * @param  int  $width  The image width in pixels (max 1280)
     * @param  int  $height  The image height in pixels (max 1280)
     * @param  int  $padding  Padding around the bounding box in pixels (default 50)
     * @return string|null The static image URL or null if access token is missing or no markers
     */
    public function generateStaticImageWithMarkersAndRoutes(
        array $markers,
        array $routes,
        int $width = 800,
        int $height = 600,
        int $padding = 50
    ): ?string {
        // Return null if no access token is configured
        if (empty($this->accessToken)) {
            Log::warning('Mapbox Static Image API called without access token configured');

            return null;
        }

        // Return null if no markers
        if (empty($markers)) {
            Log::info('Cannot generate static image without markers');

            return null;
        }

        // Validate dimensions
        if ($width < 1 || $width > 1280) {
            throw new \InvalidArgumentException('Width must be between 1 and 1280');
        }
        if ($height < 1 || $height > 1280) {
            throw new \InvalidArgumentException('Height must be between 1 and 1280');
        }

        // Use custom style to match the viewport picker
        $style = 'the-koller/cmkk2r7cg00gl01r15b1achfj';

        // Calculate bounding box from markers to determine center and zoom
        $bounds = $this->calculateBounds($markers);
        $center = $this->calculateCenter($bounds);
        $zoom = $this->calculateZoomLevel($bounds, $width, $height, $padding);

        // Build overlays (paths first, then markers on top)
        $overlays = [];

        // Add route paths
        $routeCount = 0;
        foreach ($routes as $route) {
            if (! empty($route['geometry'])) {
                $pathOverlay = $this->buildPathOverlay($route['geometry']);
                if ($pathOverlay) {
                    $overlays[] = $pathOverlay;
                    $routeCount++;
                }
            }
        }

        Log::debug('Static image with routes', [
            'total_routes' => count($routes),
            'routes_with_geometry' => $routeCount,
            'marker_count' => count($markers),
        ]);

        // Add marker overlays
        $markerOverlays = $this->buildMarkerOverlays($markers);
        if ($markerOverlays) {
            $overlays[] = $markerOverlays;
        }

        if (empty($overlays)) {
            Log::warning('No overlays generated for static image');

            return null;
        }

        // Format: /styles/v1/{username}/{style_id}/static/{overlay}/{longitude},{latitude},{zoom}/{width}x{height}
        // Using calculated center and zoom based on markers
        $overlayString = implode(',', $overlays);
        $url = sprintf(
            '%s/%s/static/%s/%s,%s,%s,0,0/%dx%d?access_token=%s',
            self::MAPBOX_STATIC_IMAGE_BASE_URL,
            $style,
            $overlayString,
            $center['longitude'],
            $center['latitude'],
            $zoom,
            $width,
            $height,
            $this->accessToken
        );

        Log::debug('Generated static image URL', [
            'url_length' => strlen($url),
            'overlay_count' => count($overlays),
        ]);

        return $url;
    }

    /**
     * Build a path overlay for route geometry.
     * Format: path-<width>+<color>-<opacity>(<coordinates>)
     * Uses URL encoding for coordinate pairs.
     *
     * @param  array  $geometry  Array of [longitude, latitude] coordinate pairs
     * @return string|null The path overlay string or null if geometry is empty
     */
    private function buildPathOverlay(array $geometry): ?string
    {
        if (empty($geometry)) {
            Log::debug('Path overlay: empty geometry provided');

            return null;
        }

        // Simplify geometry to avoid URL length limits (max ~8000 chars for Mapbox)
        // Take every Nth point to reduce coordinate count while preserving route shape
        $simplified = $this->simplifyGeometry($geometry, 50);

        Log::debug('Path overlay: geometry simplified', [
            'original_count' => count($geometry),
            'simplified_count' => count($simplified),
        ]);

        // Build coordinate string: lng,lat lng,lat lng,lat
        $coords = [];
        foreach ($simplified as $coord) {
            if (isset($coord[0], $coord[1]) && is_numeric($coord[0]) && is_numeric($coord[1])) {
                $coords[] = sprintf('%s,%s', $coord[0], $coord[1]);
            } else {
                Log::warning('Path overlay: invalid coordinate', ['coord' => $coord]);
            }
        }

        if (empty($coords)) {
            Log::warning('Path overlay: no valid coordinates after filtering');

            return null;
        }

        // Use blue color with medium width for routes
        // Format: path-<width>+<color>-<opacity>(<coordinates>)
        // URL encode the entire path overlay to handle special characters
        $coordString = implode(' ', $coords);
        $pathOverlay = sprintf(
            'path-3+0000ff-0.7(%s)',
            $coordString
        );

        Log::debug('Path overlay generated', [
            'coord_count' => count($coords),
            'overlay_length' => strlen($pathOverlay),
            'first_coords' => implode(' ', array_slice($coords, 0, 3)),
        ]);

        return $pathOverlay;
    }

    /**
     * Simplify route geometry by taking every Nth point.
     * Keeps first and last points to preserve start/end positions.
     *
     * @param  array  $geometry  Array of coordinate pairs
     * @param  int  $maxPoints  Maximum number of points to keep
     * @return array Simplified geometry
     */
    private function simplifyGeometry(array $geometry, int $maxPoints = 50): array
    {
        $count = count($geometry);

        if ($count <= $maxPoints) {
            return $geometry;
        }

        // Calculate step size to get approximately maxPoints
        $step = (int) ceil($count / $maxPoints);

        $simplified = [];
        $simplified[] = $geometry[0]; // Always keep first point

        // Take every Nth point
        for ($i = $step; $i < $count - 1; $i += $step) {
            $simplified[] = $geometry[$i];
        }

        $simplified[] = $geometry[$count - 1]; // Always keep last point

        return $simplified;
    }

    /**
     * Build marker overlays string for Mapbox Static Images API.
     * Format: pin-s-marker+color(longitude,latitude)
     *
     * @param  array  $markers  Array of markers with 'latitude' and 'longitude' keys
     * @return string Comma-separated marker overlays
     */
    private function buildMarkerOverlays(array $markers): string
    {
        $overlays = [];

        foreach ($markers as $marker) {
            // Use red color for all markers
            $overlays[] = sprintf(
                'pin-s+ff0000(%s,%s)',
                $marker['longitude'],
                $marker['latitude']
            );
        }

        return implode(',', $overlays);
    }

    /**
     * Calculate bounding box from markers.
     *
     * @param  array  $markers  Array of markers with 'latitude' and 'longitude' keys
     * @return array Bounds with minLat, maxLat, minLng, maxLng
     */
    private function calculateBounds(array $markers): array
    {
        $lats = array_column($markers, 'latitude');
        $lngs = array_column($markers, 'longitude');

        return [
            'minLat' => min($lats),
            'maxLat' => max($lats),
            'minLng' => min($lngs),
            'maxLng' => max($lngs),
        ];
    }

    /**
     * Calculate center point from bounds.
     *
     * @param  array  $bounds  Bounds array with minLat, maxLat, minLng, maxLng
     * @return array Center with latitude and longitude
     */
    private function calculateCenter(array $bounds): array
    {
        return [
            'latitude' => ($bounds['minLat'] + $bounds['maxLat']) / 2,
            'longitude' => ($bounds['minLng'] + $bounds['maxLng']) / 2,
        ];
    }

    /**
     * Calculate appropriate zoom level to fit all markers.
     * Uses a simple heuristic based on the span of coordinates.
     *
     * @param  array  $bounds  Bounds array
     * @param  int  $width  Image width
     * @param  int  $height  Image height
     * @param  int  $padding  Padding in pixels
     * @return float Zoom level (0-22)
     */
    private function calculateZoomLevel(array $bounds, int $width, int $height, int $padding): float
    {
        $latDiff = abs($bounds['maxLat'] - $bounds['minLat']);
        $lngDiff = abs($bounds['maxLng'] - $bounds['minLng']);

        // If all markers are at the same location, use a close zoom
        if ($latDiff < 0.001 && $lngDiff < 0.001) {
            return 15;
        }

        // Use the larger span to determine zoom
        $maxDiff = max($latDiff, $lngDiff);

        // Simple zoom calculation based on degree span
        // These values are approximations
        if ($maxDiff > 10) {
            return 5;
        }
        if ($maxDiff > 5) {
            return 6;
        }
        if ($maxDiff > 2) {
            return 8;
        }
        if ($maxDiff > 1) {
            return 9;
        }
        if ($maxDiff > 0.5) {
            return 10;
        }
        if ($maxDiff > 0.1) {
            return 12;
        }
        if ($maxDiff > 0.05) {
            return 13;
        }
        if ($maxDiff > 0.01) {
            return 14;
        }

        return 15;
    }
}
