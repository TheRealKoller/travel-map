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
}
