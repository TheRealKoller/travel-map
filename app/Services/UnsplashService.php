<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Unsplash\HttpClient;
use Unsplash\Photo;
use Unsplash\Search;

class UnsplashService
{
    private const CACHE_TTL_DAYS = 30;

    private bool $initialized = false;

    public function __construct(
        private readonly ?string $accessKey = null,
        private readonly ?string $utmSource = null
    ) {
        $this->initializeClient();
    }

    /**
     * Initialize the Unsplash HTTP client with credentials.
     */
    private function initializeClient(): void
    {
        if (empty($this->accessKey)) {
            Log::warning('Unsplash API accessed without access key configured');

            return;
        }

        if (empty($this->utmSource)) {
            Log::warning('Unsplash API accessed without UTM source configured');

            return;
        }

        try {
            HttpClient::init([
                'applicationId' => $this->accessKey,
                'utmSource' => $this->utmSource,
            ]);
            $this->initialized = true;
        } catch (\Exception $e) {
            Log::error('Failed to initialize Unsplash client', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Search for photos and return photo data including URLs and download location.
     *
     * @param  string  $query  Search query (e.g., "New York skyline", "Statue of Liberty")
     * @param  string  $orientation  Optional orientation filter (landscape, portrait, squarish)
     * @return array|null Array with photo data or null if not found
     */
    public function searchPhoto(string $query, string $orientation = 'landscape'): ?array
    {
        if (! $this->initialized) {
            return null;
        }

        // Create cache key from query and orientation
        $cacheKey = 'unsplash_photo_'.md5($query.'_'.$orientation);

        // Try to get from cache first
        $cachedPhoto = Cache::get($cacheKey);
        if ($cachedPhoto !== null) {
            return $cachedPhoto;
        }

        try {
            $searchResults = Search::photos($query, 1, 1, $orientation);
            $results = $searchResults->getResults();

            if (empty($results)) {
                Log::info('No Unsplash photos found for query', ['query' => $query]);

                return null;
            }

            $photo = $results[0];

            // Extract photo data as per Unsplash API guidelines
            // Handle both object and array responses
            $photoData = [
                'id' => $photo['id'] ?? $photo->id ?? null,
                'urls' => [
                    'raw' => $photo['urls']['raw'] ?? $photo->urls['raw'] ?? null,
                    'full' => $photo['urls']['full'] ?? $photo->urls['full'] ?? null,
                    'regular' => $photo['urls']['regular'] ?? $photo->urls['regular'] ?? null,
                    'small' => $photo['urls']['small'] ?? $photo->urls['small'] ?? null,
                    'thumb' => $photo['urls']['thumb'] ?? $photo->urls['thumb'] ?? null,
                ],
                'download_location' => $photo['links']['download_location'] ?? $photo->links['download_location'] ?? null,
                'user' => [
                    'name' => $photo['user']['name'] ?? $photo->user['name'] ?? null,
                    'username' => $photo['user']['username'] ?? $photo->user['username'] ?? null,
                    'profile_link' => $photo['user']['links']['html'] ?? $photo->user['links']['html'] ?? null,
                ],
                'alt_description' => $photo['alt_description'] ?? $photo->alt_description ?? $photo['description'] ?? $photo->description ?? null,
            ];

            // Cache the result for 30 days
            Cache::put($cacheKey, $photoData, now()->addDays(self::CACHE_TTL_DAYS));

            return $photoData;
        } catch (\Exception $e) {
            Log::error('Unsplash API exception', [
                'message' => $e->getMessage(),
                'query' => $query,
            ]);

            return null;
        }
    }

    /**
     * Track a photo download to increment view count.
     * This should be called when the user "uses" the photo (e.g., clicks to load it).
     *
     * @param  string  $downloadLocation  The download_location URL from the photo data
     * @return bool Success status
     */
    public function trackDownload(string $downloadLocation): bool
    {
        if (! $this->initialized) {
            return false;
        }

        try {
            // The download location is already a full URL with query parameters
            // We need to extract the photo ID and call the download endpoint
            $photoId = $this->extractPhotoIdFromDownloadLocation($downloadLocation);
            if ($photoId) {
                Photo::find($photoId)->download();

                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Failed to track Unsplash download', [
                'message' => $e->getMessage(),
                'download_location' => $downloadLocation,
            ]);

            return false;
        }
    }

    /**
     * Extract photo ID from download location URL.
     *
     * @param  string  $downloadLocation  The download location URL
     * @return string|null The photo ID or null
     */
    private function extractPhotoIdFromDownloadLocation(string $downloadLocation): ?string
    {
        // Download location format: https://api.unsplash.com/photos/{id}/download?ixid=...
        if (preg_match('/\/photos\/([^\/\?]+)\/download/', $downloadLocation, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Get photo data for a trip by name.
     *
     * @param  string  $tripName  Name of the trip
     * @return array|null Photo data or null if not found
     */
    public function getPhotoForTrip(string $tripName): ?array
    {
        // Enhance query with travel-related terms for better results
        $query = $tripName.' travel destination';

        return $this->searchPhoto($query, 'landscape');
    }

    /**
     * Get photo data for a marker by name and type.
     *
     * @param  string  $markerName  Name of the marker
     * @param  string|null  $markerType  Type of the marker (optional)
     * @return array|null Photo data or null if not found
     */
    public function getPhotoForMarker(string $markerName, ?string $markerType = null): ?array
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
