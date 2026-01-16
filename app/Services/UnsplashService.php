<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UnsplashService
{
    private const UNSPLASH_API_BASE_URL = 'https://api.unsplash.com';

    private const CACHE_TTL_DAYS = 30;

    private const TIMEOUT_SECONDS = 10;

    public function __construct(
        private readonly ?string $accessKey = null
    ) {}

    /**
     * Search for a photo by query and return the URL.
     *
     * @param  string  $query  Search query (e.g., "New York skyline", "Statue of Liberty")
     * @param  string  $orientation  Optional orientation filter (landscape, portrait, squarish)
     * @return string|null The URL of the photo, or null if not found
     */
    public function searchPhoto(string $query, string $orientation = 'landscape'): ?string
    {
        // Return null if no access key is configured
        if (empty($this->accessKey)) {
            Log::warning('Unsplash API called without access key configured');

            return null;
        }

        // Create cache key from query and orientation
        $cacheKey = 'unsplash_photo_'.md5($query.'_'.$orientation);

        // Try to get from cache first
        $cachedUrl = Cache::get($cacheKey);
        if ($cachedUrl !== null) {
            return $cachedUrl;
        }

        try {
            $response = Http::timeout(self::TIMEOUT_SECONDS)
                ->withHeaders([
                    'Authorization' => 'Client-ID '.$this->accessKey,
                    'Accept-Version' => 'v1',
                ])
                ->get(self::UNSPLASH_API_BASE_URL.'/search/photos', [
                    'query' => $query,
                    'per_page' => 1,
                    'orientation' => $orientation,
                    'order_by' => 'relevant',
                ]);

            if (! $response->successful()) {
                Log::warning('Unsplash API request failed', [
                    'status' => $response->status(),
                    'query' => $query,
                ]);

                return null;
            }

            $data = $response->json();

            // Check if we have results
            if (empty($data['results']) || count($data['results']) === 0) {
                Log::info('No Unsplash photos found for query', ['query' => $query]);

                return null;
            }

            // Get the first result's regular-sized image URL
            $photoUrl = $data['results'][0]['urls']['regular'] ?? null;

            if ($photoUrl) {
                // Cache the result for 30 days
                Cache::put($cacheKey, $photoUrl, now()->addDays(self::CACHE_TTL_DAYS));
            }

            return $photoUrl;
        } catch (\Exception $e) {
            Log::error('Unsplash API exception', [
                'message' => $e->getMessage(),
                'query' => $query,
            ]);

            return null;
        }
    }

    /**
     * Get a photo URL for a trip by name.
     *
     * @param  string  $tripName  Name of the trip
     * @return string|null The URL of the photo, or null if not found
     */
    public function getPhotoForTrip(string $tripName): ?string
    {
        // Enhance query with travel-related terms for better results
        $query = $tripName.' travel destination';

        return $this->searchPhoto($query, 'landscape');
    }

    /**
     * Get a photo URL for a marker by name and type.
     *
     * @param  string  $markerName  Name of the marker
     * @param  string|null  $markerType  Type of the marker (optional)
     * @return string|null The URL of the photo, or null if not found
     */
    public function getPhotoForMarker(string $markerName, ?string $markerType = null): ?string
    {
        // Build query with marker name and optional type
        $query = $markerName;
        if ($markerType && $markerType !== 'question' && $markerType !== 'tip') {
            $query .= ' '.$markerType;
        }

        return $this->searchPhoto($query, 'landscape');
    }

    /**
     * Clear cached photo for a specific query.
     *
     * @param  string  $query  The search query
     * @param  string  $orientation  The orientation used
     */
    public function clearCache(string $query, string $orientation = 'landscape'): void
    {
        $cacheKey = 'unsplash_photo_'.md5($query.'_'.$orientation);
        Cache::forget($cacheKey);
    }
}
