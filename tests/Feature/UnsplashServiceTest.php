<?php

use App\Services\UnsplashService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    // Clear cache before each test
    Cache::flush();

    // Set a test access key
    Config::set('services.unsplash.access_key', 'test-access-key');
});

test('searchPhoto returns null when no access key is configured', function () {
    Config::set('services.unsplash.access_key', null);

    $service = new UnsplashService(null);
    $result = $service->searchPhoto('New York');

    expect($result)->toBeNull();
});

test('searchPhoto returns photo URL on successful API response', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-123?w=1080',
                        'small' => 'https://images.unsplash.com/photo-123?w=400',
                    ],
                    'alt_description' => 'New York skyline',
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');
    $result = $service->searchPhoto('New York');

    expect($result)->toBe('https://images.unsplash.com/photo-123?w=1080');
});

test('searchPhoto caches results for 30 days', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-456?w=1080',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');

    // First call should hit the API
    $result1 = $service->searchPhoto('Paris');
    expect($result1)->toBe('https://images.unsplash.com/photo-456?w=1080');

    // Second call should use cache (verify by checking HTTP was only called once)
    Http::assertSentCount(1);

    $result2 = $service->searchPhoto('Paris');
    expect($result2)->toBe('https://images.unsplash.com/photo-456?w=1080');

    // Still only one API call
    Http::assertSentCount(1);
});

test('searchPhoto returns null when API returns empty results', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');
    $result = $service->searchPhoto('nonexistent-place-xyz');

    expect($result)->toBeNull();
});

test('searchPhoto returns null when API request fails', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([], 500),
    ]);

    $service = new UnsplashService('test-access-key');
    $result = $service->searchPhoto('Tokyo');

    expect($result)->toBeNull();
});

test('searchPhoto handles network exceptions gracefully', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => fn () => throw new \Exception('Network error'),
    ]);

    $service = new UnsplashService('test-access-key');
    $result = $service->searchPhoto('London');

    expect($result)->toBeNull();
});

test('searchPhoto sends correct request parameters', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-789?w=1080',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');
    $service->searchPhoto('Rome', 'portrait');

    Http::assertSent(function ($request) {
        $hasCorrectUrl = str_starts_with($request->url(), 'https://api.unsplash.com/search/photos');
        $hasCorrectParams = $request['query'] === 'Rome' &&
            $request['orientation'] === 'portrait' &&
            $request['per_page'] === 1 &&
            $request['order_by'] === 'relevant';
        $hasCorrectHeader = $request->hasHeader('Authorization', 'Client-ID test-access-key');

        return $hasCorrectUrl && $hasCorrectParams && $hasCorrectHeader;
    });
});

test('getPhotoForTrip enhances query with travel-related terms', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-trip?w=1080',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');
    $result = $service->getPhotoForTrip('Barcelona');

    expect($result)->toBe('https://images.unsplash.com/photo-trip?w=1080');

    Http::assertSent(function ($request) {
        return str_contains($request['query'], 'Barcelona') &&
            str_contains($request['query'], 'travel destination');
    });
});

test('getPhotoForMarker includes marker type in query', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-marker?w=1080',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');
    $result = $service->getPhotoForMarker('Eiffel Tower', 'point of interest');

    expect($result)->toBe('https://images.unsplash.com/photo-marker?w=1080');

    Http::assertSent(function ($request) {
        return str_contains($request['query'], 'Eiffel Tower') &&
            str_contains($request['query'], 'point of interest');
    });
});

test('getPhotoForMarker excludes question and tip types from query', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-marker2?w=1080',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');
    $service->getPhotoForMarker('Where to eat?', 'question');

    Http::assertSent(function ($request) {
        return $request['query'] === 'Where to eat?' &&
            ! str_contains($request['query'], 'question');
    });
});

test('clearCache removes cached photo', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-clear?w=1080',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');

    // First call caches the result
    $result1 = $service->searchPhoto('Madrid');
    expect($result1)->toBe('https://images.unsplash.com/photo-clear?w=1080');
    Http::assertSentCount(1);

    // Clear the cache
    $service->clearCache('Madrid', 'landscape');

    // Next call should hit the API again
    $result2 = $service->searchPhoto('Madrid');
    expect($result2)->toBe('https://images.unsplash.com/photo-clear?w=1080');
    Http::assertSentCount(2);
});

test('searchPhoto uses different cache keys for different orientations', function () {
    Http::fake([
        'api.unsplash.com/search/photos*' => Http::response([
            'results' => [
                [
                    'urls' => [
                        'regular' => 'https://images.unsplash.com/photo-orient?w=1080',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new UnsplashService('test-access-key');

    // Call with landscape orientation
    $service->searchPhoto('Vienna', 'landscape');
    Http::assertSentCount(1);

    // Call with portrait orientation should hit API again
    $service->searchPhoto('Vienna', 'portrait');
    Http::assertSentCount(2);

    // Call with landscape orientation should use cache
    $service->searchPhoto('Vienna', 'landscape');
    Http::assertSentCount(2);
});
