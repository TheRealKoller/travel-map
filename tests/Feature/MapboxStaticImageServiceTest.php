<?php

use App\Services\MapboxStaticImageService;

beforeEach(function () {
    // Use a fake token for testing
    $this->accessToken = 'pk.test.fake_token_for_testing_only';
    $this->service = new MapboxStaticImageService($this->accessToken);
});

test('generates static image URL with valid parameters', function () {
    $url = $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 12.5
    );

    expect($url)->toContain('api.mapbox.com/styles/v1/the-koller/cmkk2r7cg00gl01r15b1achfj/static')
        ->and($url)->toContain('8.5417,47.3769,12.5')
        ->and($url)->toContain('800x400')
        ->and($url)->toContain('access_token='.$this->accessToken);
});

test('generates static image URL with custom dimensions', function () {
    $url = $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 10,
        width: 1280,
        height: 640
    );

    expect($url)->toContain('1280x640');
});

test('returns null when access token is missing', function () {
    $service = new MapboxStaticImageService(null);

    $url = $service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 12.5
    );

    expect($url)->toBeNull();
});

test('throws exception for invalid latitude', function () {
    $this->service->generateStaticImageUrl(
        latitude: 95, // Invalid
        longitude: 8.5417,
        zoom: 12.5
    );
})->throws(\InvalidArgumentException::class, 'Latitude must be between -90 and 90');

test('throws exception for invalid longitude', function () {
    $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 185, // Invalid
        zoom: 12.5
    );
})->throws(\InvalidArgumentException::class, 'Longitude must be between -180 and 180');

test('throws exception for invalid zoom', function () {
    $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 25 // Invalid
    );
})->throws(\InvalidArgumentException::class, 'Zoom must be between 0 and 22');

test('throws exception for invalid width', function () {
    $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 12.5,
        width: 1500 // Invalid
    );
})->throws(\InvalidArgumentException::class, 'Width must be between 1 and 1280');

test('throws exception for invalid height', function () {
    $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 12.5,
        height: 1500 // Invalid
    );
})->throws(\InvalidArgumentException::class, 'Height must be between 1 and 1280');

test('uses custom style', function () {
    $url = $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 12.5
    );

    expect($url)->toContain('/the-koller/cmkk2r7cg00gl01r15b1achfj/static');
});

test('sets bearing and pitch to 0', function () {
    $url = $this->service->generateStaticImageUrl(
        latitude: 47.3769,
        longitude: 8.5417,
        zoom: 12.5
    );

    // Check that bearing and pitch are set to 0 in the URL
    expect($url)->toContain(',0,0/');
});

test('generates static image URL with markers', function () {
    $markers = [
        ['latitude' => 47.3769, 'longitude' => 8.5417],
        ['latitude' => 46.9480, 'longitude' => 7.4474],
    ];

    $url = $this->service->generateStaticImageWithMarkers(
        markers: $markers,
        width: 800,
        height: 600
    );

    expect($url)->toContain('api.mapbox.com/styles/v1/the-koller/cmkk2r7cg00gl01r15b1achfj/static')
        ->and($url)->toContain('pin-s+ff0000')
        ->and($url)->toContain('800x600')
        ->and($url)->toContain('auto')
        ->and($url)->toContain('padding=50')
        ->and($url)->toContain('access_token='.$this->accessToken);
});

test('generates static image with markers using custom dimensions', function () {
    $markers = [
        ['latitude' => 47.3769, 'longitude' => 8.5417],
    ];

    $url = $this->service->generateStaticImageWithMarkers(
        markers: $markers,
        width: 1280,
        height: 640,
        padding: 100
    );

    expect($url)->toContain('1280x640')
        ->and($url)->toContain('padding=100');
});

test('returns null when generating static image with markers without access token', function () {
    $service = new MapboxStaticImageService(null);
    $markers = [
        ['latitude' => 47.3769, 'longitude' => 8.5417],
    ];

    $url = $service->generateStaticImageWithMarkers(
        markers: $markers
    );

    expect($url)->toBeNull();
});

test('returns null when generating static image with empty markers array', function () {
    $url = $this->service->generateStaticImageWithMarkers(
        markers: []
    );

    expect($url)->toBeNull();
});

test('throws exception for invalid width when generating static image with markers', function () {
    $markers = [
        ['latitude' => 47.3769, 'longitude' => 8.5417],
    ];

    $this->service->generateStaticImageWithMarkers(
        markers: $markers,
        width: 1500
    );
})->throws(\InvalidArgumentException::class, 'Width must be between 1 and 1280');

test('throws exception for invalid height when generating static image with markers', function () {
    $markers = [
        ['latitude' => 47.3769, 'longitude' => 8.5417],
    ];

    $this->service->generateStaticImageWithMarkers(
        markers: $markers,
        height: 1500
    );
})->throws(\InvalidArgumentException::class, 'Height must be between 1 and 1280');

test('generates correct marker overlays for multiple markers', function () {
    $markers = [
        ['latitude' => 47.3769, 'longitude' => 8.5417],
        ['latitude' => 46.9480, 'longitude' => 7.4474],
        ['latitude' => 47.5596, 'longitude' => 7.5886],
    ];

    $url = $this->service->generateStaticImageWithMarkers(
        markers: $markers
    );

    // Check that all markers are included in the URL
    expect($url)->toContain('pin-s+ff0000(8.5417,47.3769)')
        ->and($url)->toContain('pin-s+ff0000(7.4474,46.948)')
        ->and($url)->toContain('pin-s+ff0000(7.5886,47.5596)');
});
