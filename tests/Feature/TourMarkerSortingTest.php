<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    // Create a user and authenticate
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    // Create a trip
    $this->trip = Trip::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Test Trip',
    ]);

    // Create a tour
    $this->tour = Tour::create([
        'trip_id' => $this->trip->id,
        'name' => 'Test Tour',
    ]);

    // Create markers
    $this->markers = [
        Marker::factory()->create([
            'user_id' => $this->user->id,
            'trip_id' => $this->trip->id,
            'name' => 'Marker 1',
            'latitude' => 47.3769,
            'longitude' => 8.5417,
        ]),
        Marker::factory()->create([
            'user_id' => $this->user->id,
            'trip_id' => $this->trip->id,
            'name' => 'Marker 2',
            'latitude' => 47.5596,
            'longitude' => 7.5886,
        ]),
        Marker::factory()->create([
            'user_id' => $this->user->id,
            'trip_id' => $this->trip->id,
            'name' => 'Marker 3',
            'latitude' => 46.9480,
            'longitude' => 7.4474,
        ]),
    ];

    // Attach markers to tour
    foreach ($this->markers as $index => $marker) {
        $this->tour->markers()->attach($marker->id, ['position' => $index]);
    }

    // Configure Mapbox token
    config(['services.mapbox.access_token' => 'pk.test.fake_token']);
});

test('sorts markers in a tour successfully', function () {
    // Mock the Mapbox Matrix API response
    Http::fake([
        'api.mapbox.com/directions-matrix/*' => Http::response([
            'code' => 'Ok',
            'durations' => [
                [0, 3234.5, 5123.2],
                [3234.5, 0, 4234.1],
                [5123.2, 4234.1, 0],
            ],
            'distances' => [
                [0, 101234.5, 153423.8],
                [101234.5, 0, 132345.2],
                [153423.8, 132345.2, 0],
            ],
        ], 200),
    ]);

    $response = $this->postJson("/tours/{$this->tour->id}/markers/sort");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'id',
            'name',
            'trip_id',
            'markers' => [
                '*' => ['id', 'name', 'latitude', 'longitude'],
            ],
        ]);

    // Verify Mapbox API was called
    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'api.mapbox.com/directions-matrix')
            && str_contains($request->url(), 'walking');
    });

    // Verify markers are still attached to tour
    $this->tour->refresh();
    expect($this->tour->markers)->toHaveCount(3);
});

test('returns error when tour has less than 2 markers', function () {
    // Create tour with only 1 marker
    $tour = Tour::create([
        'trip_id' => $this->trip->id,
        'name' => 'Small Tour',
    ]);
    $tour->markers()->attach($this->markers[0]->id, ['position' => 0]);

    $response = $this->postJson("/tours/{$tour->id}/markers/sort");

    $response->assertStatus(422)
        ->assertJson([
            'error' => 'Tour must have at least 2 markers to sort',
        ]);
});

test('returns error when tour has too many markers', function () {
    // Create a tour with 26 markers
    $tour = Tour::create([
        'trip_id' => $this->trip->id,
        'name' => 'Large Tour',
    ]);

    for ($i = 0; $i < 26; $i++) {
        $marker = Marker::factory()->create([
            'user_id' => $this->user->id,
            'trip_id' => $this->trip->id,
            'name' => "Marker {$i}",
            'latitude' => 47.3769 + ($i * 0.01),
            'longitude' => 8.5417 + ($i * 0.01),
        ]);
        $tour->markers()->attach($marker->id, ['position' => $i]);
    }

    $response = $this->postJson("/tours/{$tour->id}/markers/sort");

    $response->assertStatus(422)
        ->assertJson([
            'error' => 'Tour has too many markers. Maximum is 25 markers for automatic sorting.',
        ]);
});

test('requires authentication', function () {
    auth()->logout();

    $response = $this->postJson("/tours/{$this->tour->id}/markers/sort");

    $response->assertStatus(401);
});

test('requires tour ownership', function () {
    // Create another user and trip
    $otherUser = User::factory()->create();
    $otherTrip = Trip::factory()->create(['user_id' => $otherUser->id]);
    $otherTour = Tour::create([
        'trip_id' => $otherTrip->id,
        'name' => 'Other Tour',
    ]);

    // Try to sort other user's tour
    $response = $this->postJson("/tours/{$otherTour->id}/markers/sort");

    $response->assertStatus(403);
});

test('handles Mapbox quota exceeded error', function () {
    // Mock the MapboxRequestLimiter to throw quota exceeded exception
    $this->mock(\App\Services\MapboxRequestLimiter::class, function ($mock) {
        $mock->shouldReceive('checkQuota')
            ->once()
            ->andThrow(new \App\Exceptions\MapboxQuotaExceededException('Quota exceeded'));
    });

    $response = $this->postJson("/tours/{$this->tour->id}/markers/sort");

    $response->assertStatus(429)
        ->assertJsonStructure(['error']);
});

test('handles Mapbox API failure', function () {
    // Mock API failure
    Http::fake([
        'api.mapbox.com/directions-matrix/*' => Http::response(['error' => 'Server error'], 500),
    ]);

    $response = $this->postJson("/tours/{$this->tour->id}/markers/sort");

    $response->assertStatus(503)
        ->assertJsonStructure(['error']);
});

test('updates marker positions in database', function () {
    // Mock the Mapbox Matrix API response with specific distances
    // that will result in a predictable order
    Http::fake([
        'api.mapbox.com/directions-matrix/*' => Http::response([
            'code' => 'Ok',
            'durations' => [
                [0, 100, 200],
                [100, 0, 150],
                [200, 150, 0],
            ],
            'distances' => [
                [0, 10000, 20000],
                [10000, 0, 15000],
                [20000, 15000, 0],
            ],
        ], 200),
    ]);

    $this->postJson("/tours/{$this->tour->id}/markers/sort");

    // Refresh tour and check marker positions
    $this->tour->refresh();
    $sortedMarkers = $this->tour->markers()->orderByPivot('position')->get();

    // Verify all markers are still attached
    expect($sortedMarkers)->toHaveCount(3);

    // Verify positions are sequential
    expect($sortedMarkers[0]->pivot->position)->toBe(0)
        ->and($sortedMarkers[1]->pivot->position)->toBe(1)
        ->and($sortedMarkers[2]->pivot->position)->toBe(2);
});
