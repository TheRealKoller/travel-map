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
            Log::warning('Unsplash API not initialized - missing access key or UTM source');

            return null;
        }

        // Create cache key from query and orientation
        $cacheKey = 'unsplash_photo_'.md5($query.'_'.$orientation);

        // Try to get from cache first
        $cachedPhoto = Cache::get($cacheKey);
        if ($cachedPhoto !== null) {
            Log::info('Unsplash photo found in cache', ['query' => $query, 'orientation' => $orientation]);

            return $cachedPhoto;
        }

        Log::info('Calling Unsplash API', ['query' => $query, 'orientation' => $orientation]);

        try {
            $searchResults = Search::photos($query, 1, 1, $orientation);
            $results = $searchResults->getResults();

            Log::debug('Unsplash API response received', [
                'query' => $query,
                'result_count' => count($results),
                'results_data' => $results,
            ]);

            if (empty($results)) {
                Log::info('No Unsplash photos found for query', ['query' => $query, 'orientation' => $orientation]);

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

            Log::info('Unsplash photo retrieved and cached', [
                'query' => $query,
                'orientation' => $orientation,
                'photo_id' => $photoData['id'],
                'has_url' => ! empty($photoData['urls']['regular']),
            ]);

            return $photoData;
        } catch (\Exception $e) {
            Log::error('Unsplash API exception', [
                'message' => $e->getMessage(),
                'query' => $query,
                'trace' => $e->getTraceAsString(),
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
     * Get photo data for a trip by name and optional country.
     *
     * @param  string  $tripName  Name of the trip
     * @param  string|null  $countryCode  Optional country code (e.g., 'DE', 'US')
     * @return array|null Photo data or null if not found
     */
    public function getPhotoForTrip(string $tripName, ?string $countryCode = null): ?array
    {
        // Build query with trip name
        $query = $tripName;

        // Add country name to query if country code is provided
        if ($countryCode) {
            $countryName = $this->getCountryName($countryCode);
            if ($countryName) {
                $query = $countryName.' '.$query;
            }
        }

        // Enhance query with travel-related terms for better results
        $query .= ' travel destination';

        return $this->searchPhoto($query, 'landscape');
    }

    /**
     * Convert country code to country name for better search results.
     *
     * @param  string  $countryCode  ISO 3166-1 alpha-2 country code
     * @return string|null Country name or null if not found
     */
    private function getCountryName(string $countryCode): ?string
    {
        $countries = [
            'DE' => 'Germany',
            'AT' => 'Austria',
            'CH' => 'Switzerland',
            'FR' => 'France',
            'IT' => 'Italy',
            'ES' => 'Spain',
            'PT' => 'Portugal',
            'GB' => 'United Kingdom',
            'IE' => 'Ireland',
            'NL' => 'Netherlands',
            'BE' => 'Belgium',
            'LU' => 'Luxembourg',
            'DK' => 'Denmark',
            'SE' => 'Sweden',
            'NO' => 'Norway',
            'FI' => 'Finland',
            'IS' => 'Iceland',
            'PL' => 'Poland',
            'CZ' => 'Czech Republic',
            'SK' => 'Slovakia',
            'HU' => 'Hungary',
            'RO' => 'Romania',
            'BG' => 'Bulgaria',
            'HR' => 'Croatia',
            'SI' => 'Slovenia',
            'GR' => 'Greece',
            'TR' => 'Turkey',
            'CY' => 'Cyprus',
            'MT' => 'Malta',
            'EE' => 'Estonia',
            'LV' => 'Latvia',
            'LT' => 'Lithuania',
            'US' => 'United States',
            'CA' => 'Canada',
            'MX' => 'Mexico',
            'BR' => 'Brazil',
            'AR' => 'Argentina',
            'CL' => 'Chile',
            'PE' => 'Peru',
            'CO' => 'Colombia',
            'JP' => 'Japan',
            'CN' => 'China',
            'KR' => 'South Korea',
            'TH' => 'Thailand',
            'VN' => 'Vietnam',
            'IN' => 'India',
            'ID' => 'Indonesia',
            'MY' => 'Malaysia',
            'SG' => 'Singapore',
            'PH' => 'Philippines',
            'AU' => 'Australia',
            'NZ' => 'New Zealand',
            'ZA' => 'South Africa',
            'EG' => 'Egypt',
            'MA' => 'Morocco',
            'TN' => 'Tunisia',
            'KE' => 'Kenya',
            'TZ' => 'Tanzania',
            'AE' => 'United Arab Emirates',
            'SA' => 'Saudi Arabia',
            'IL' => 'Israel',
            'JO' => 'Jordan',
            'RU' => 'Russia',
            'UA' => 'Ukraine',
            'BY' => 'Belarus',
            'RS' => 'Serbia',
            'BA' => 'Bosnia and Herzegovina',
            'ME' => 'Montenegro',
            'MK' => 'North Macedonia',
            'AL' => 'Albania',
        ];

        return $countries[$countryCode] ?? null;
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
        // Only include types that improve search results (exclude generic ones like "point_of_interest")
        $specificeTypes = [
            'hotel', 'restaurant', 'cafe', 'bar', 'museum', 'monument',
            'castle', 'ruins', 'church', 'temple', 'mosque', 'park',
            'garden', 'zoo', 'beach', 'shop', 'cinema', 'theatre',
            'gallery', 'library', 'hospital', 'airport', 'train_station',
        ];

        $query = $markerName;
        if ($markerType && in_array($markerType, $specificeTypes, true)) {
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
