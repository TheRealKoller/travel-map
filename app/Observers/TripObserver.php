<?php

namespace App\Observers;

use App\Models\Trip;
use App\Services\MapboxStaticImageService;

class TripObserver
{
    public function __construct(
        private readonly MapboxStaticImageService $mapboxStaticImageService
    ) {}

    /**
     * Handle the Trip "saving" event.
     * Updates the viewport static image URL when viewport fields change.
     */
    public function saving(Trip $trip): void
    {
        // Check if viewport fields are set
        if ($trip->viewport_latitude !== null && $trip->viewport_longitude !== null && $trip->viewport_zoom !== null) {
            // Generate static image URL
            $staticImageUrl = $this->mapboxStaticImageService->generateStaticImageUrl(
                latitude: $trip->viewport_latitude,
                longitude: $trip->viewport_longitude,
                zoom: $trip->viewport_zoom
            );

            if ($staticImageUrl) {
                $trip->viewport_static_image_url = $staticImageUrl;
            }
        } else {
            // Clear static image URL if viewport is removed
            $trip->viewport_static_image_url = null;
        }
    }
}
