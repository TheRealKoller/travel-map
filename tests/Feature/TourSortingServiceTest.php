<?php

use App\Models\Marker;
use App\Services\TourSortingService;

beforeEach(function () {
    $this->service = app(TourSortingService::class);
});

test('sorts markers optimally using nearest neighbor algorithm', function () {
    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
        new Marker(['id' => 'marker3', 'latitude' => 46.9480, 'longitude' => 7.4474]),
    ];

    // Distance matrix (in meters)
    // marker1 to marker2: 100km, marker2 to marker3: 50km, marker1 to marker3: 120km
    $matrix = [
        'distances' => [
            [0, 100000, 120000],      // from marker1
            [100000, 0, 50000],       // from marker2
            [120000, 50000, 0],       // from marker3
        ],
        'durations' => [
            [0, 3600, 4320],
            [3600, 0, 1800],
            [4320, 1800, 0],
        ],
    ];

    $sortedIds = $this->service->sortMarkersOptimally($markers, $matrix);

    // Should return array of marker IDs
    expect($sortedIds)->toBeArray()
        ->and(count($sortedIds))->toBe(3)
        ->and($sortedIds[0])->toBe('marker1')
        ->and($sortedIds[1])->toBe('marker2')
        ->and($sortedIds[2])->toBe('marker3');
});

test('handles single marker', function () {
    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
    ];

    $matrix = [
        'distances' => [[0]],
        'durations' => [[0]],
    ];

    $sortedIds = $this->service->sortMarkersOptimally($markers, $matrix);

    expect($sortedIds)->toBeArray()
        ->and(count($sortedIds))->toBe(1)
        ->and($sortedIds[0])->toBe('marker1');
});

test('handles two markers', function () {
    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
    ];

    $matrix = [
        'distances' => [
            [0, 100000],
            [100000, 0],
        ],
        'durations' => [
            [0, 3600],
            [3600, 0],
        ],
    ];

    $sortedIds = $this->service->sortMarkersOptimally($markers, $matrix);

    expect($sortedIds)->toBeArray()
        ->and(count($sortedIds))->toBe(2);
});

test('finds optimal order for 4 markers', function () {
    $markers = [
        new Marker(['id' => 'A', 'latitude' => 0, 'longitude' => 0]),
        new Marker(['id' => 'B', 'latitude' => 1, 'longitude' => 0]),
        new Marker(['id' => 'C', 'latitude' => 1, 'longitude' => 1]),
        new Marker(['id' => 'D', 'latitude' => 0, 'longitude' => 1]),
    ];

    // Simple square layout where optimal path is A->B->C->D or A->D->C->B
    $matrix = [
        'distances' => [
            [0, 100, 141, 100],  // A to all
            [100, 0, 100, 141],  // B to all
            [141, 100, 0, 100],  // C to all
            [100, 141, 100, 0],  // D to all
        ],
        'durations' => [
            [0, 100, 141, 100],
            [100, 0, 100, 141],
            [141, 100, 0, 100],
            [100, 141, 100, 0],
        ],
    ];

    $sortedIds = $this->service->sortMarkersOptimally($markers, $matrix);

    expect($sortedIds)->toBeArray()
        ->and(count($sortedIds))->toBe(4);

    // Verify it found a reasonable path (not crossing diagonals)
    // The order should be A, B, C, D or A, D, C, B
    $validOrders = [
        ['A', 'B', 'C', 'D'],
        ['A', 'D', 'C', 'B'],
    ];

    expect($validOrders)->toContain($sortedIds);
});

test('handles null distances in matrix', function () {
    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
        new Marker(['id' => 'marker3', 'latitude' => 46.9480, 'longitude' => 7.4474]),
    ];

    // Simulate some routes not being available
    $matrix = [
        'distances' => [
            [0, null, 120000],
            [null, 0, 50000],
            [120000, 50000, 0],
        ],
        'durations' => [
            [0, null, 4320],
            [null, 0, 1800],
            [4320, 1800, 0],
        ],
    ];

    $sortedIds = $this->service->sortMarkersOptimally($markers, $matrix);

    // Should still return all markers even if some routes are unavailable
    expect($sortedIds)->toBeArray()
        ->and(count($sortedIds))->toBe(3);
});

test('calculates total distance correctly', function () {
    $order = [0, 1, 2];
    $distances = [
        [0, 100, 200],
        [100, 0, 150],
        [200, 150, 0],
    ];

    $totalDistance = $this->service->calculateTotalDistance($order, $distances);

    // Distance from 0->1 is 100, 1->2 is 150
    expect($totalDistance)->toBe(250.0);
});

test('calculates total distance with null values', function () {
    $order = [0, 1, 2];
    $distances = [
        [0, null, 200],
        [null, 0, 150],
        [200, 150, 0],
    ];

    $totalDistance = $this->service->calculateTotalDistance($order, $distances);

    // Only includes the valid distance (1->2 = 150)
    expect($totalDistance)->toBe(150.0);
});

test('returns empty array for empty input', function () {
    $sortedIds = $this->service->sortMarkersOptimally([], ['distances' => [], 'durations' => []]);

    expect($sortedIds)->toBeArray()->toBeEmpty();
});

test('preserves all markers in output', function () {
    $markers = [
        new Marker(['id' => 'marker1', 'latitude' => 47.3769, 'longitude' => 8.5417]),
        new Marker(['id' => 'marker2', 'latitude' => 47.5596, 'longitude' => 7.5886]),
        new Marker(['id' => 'marker3', 'latitude' => 46.9480, 'longitude' => 7.4474]),
    ];

    $matrix = [
        'distances' => [
            [0, 100000, 120000],
            [100000, 0, 50000],
            [120000, 50000, 0],
        ],
        'durations' => [
            [0, 3600, 4320],
            [3600, 0, 1800],
            [4320, 1800, 0],
        ],
    ];

    $sortedIds = $this->service->sortMarkersOptimally($markers, $matrix);

    // All marker IDs should be present in output
    expect($sortedIds)->toContain('marker1')
        ->and($sortedIds)->toContain('marker2')
        ->and($sortedIds)->toContain('marker3');
});
