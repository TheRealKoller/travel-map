<?php

use App\Http\Resources\RouteMarkerResource;
use App\Models\Marker;

uses()->group('resources');

it('transforms marker to array with correct structure', function () {
    $marker = Marker::factory()->create([
        'name' => 'Test Marker',
        'latitude' => 48.8566,
        'longitude' => 2.3522,
    ]);

    $resource = new RouteMarkerResource($marker);
    $array = $resource->toArray(request());

    expect($array)->toHaveKeys(['id', 'name', 'latitude', 'longitude'])
        ->and($array['id'])->toBe($marker->id)
        ->and($array['name'])->toBe('Test Marker')
        ->and($array['latitude'])->toBe(48.8566)
        ->and($array['longitude'])->toBe(2.3522);
});

it('transforms marker with different coordinates correctly', function () {
    $marker = Marker::factory()->create([
        'name' => 'Another Marker',
        'latitude' => 51.5074,
        'longitude' => -0.1278,
    ]);

    $resource = new RouteMarkerResource($marker);
    $array = $resource->toArray(request());

    expect($array['latitude'])->toBe(51.5074)
        ->and($array['longitude'])->toBe(-0.1278);
});

it('only includes essential marker fields in route context', function () {
    $marker = Marker::factory()->create([
        'name' => 'Complete Marker',
        'latitude' => 40.7128,
        'longitude' => -74.0060,
        'type' => 'restaurant',
        'notes' => 'Some notes',
        'url' => 'https://example.com',
        'is_unesco' => true,
    ]);

    $resource = new RouteMarkerResource($marker);
    $array = $resource->toArray(request());

    // Should only include id, name, latitude, longitude
    expect($array)->toHaveCount(4)
        ->and($array)->not->toHaveKey('type')
        ->and($array)->not->toHaveKey('notes')
        ->and($array)->not->toHaveKey('url')
        ->and($array)->not->toHaveKey('is_unesco')
        ->and($array)->not->toHaveKey('trip_id')
        ->and($array)->not->toHaveKey('user_id');
});
