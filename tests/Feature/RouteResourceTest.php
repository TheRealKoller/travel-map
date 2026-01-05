<?php

use App\Http\Resources\RouteMarkerResource;
use App\Http\Resources\RouteResource;
use App\Models\Marker;
use App\Models\Route;
use App\Models\Trip;
use App\Models\User;

uses()->group('resources');

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->startMarker = Marker::factory()->create(['trip_id' => $this->trip->id]);
    $this->endMarker = Marker::factory()->create(['trip_id' => $this->trip->id]);
});

it('transforms route with nested marker resources', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'distance' => 50000,
        'duration' => 3600,
    ]);

    $route->load(['startMarker', 'endMarker']);

    $resource = new RouteResource($route);
    $array = $resource->toArray(request());

    // The start_marker and end_marker should be RouteMarkerResource instances
    expect($array)->toHaveKey('start_marker')
        ->and($array)->toHaveKey('end_marker')
        ->and($array['start_marker'])->toBeInstanceOf(RouteMarkerResource::class)
        ->and($array['end_marker'])->toBeInstanceOf(RouteMarkerResource::class);
});

it('includes all required marker fields in start_marker', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
    ]);

    $route->load(['startMarker', 'endMarker']);

    $resource = new RouteResource($route);
    $array = $resource->toArray(request());

    // Resolve the nested resource to array
    $startMarkerArray = $array['start_marker']->toArray(request());

    expect($startMarkerArray)->toHaveKeys(['id', 'name', 'latitude', 'longitude'])
        ->and($startMarkerArray['id'])->toBe($this->startMarker->id)
        ->and($startMarkerArray['name'])->toBe($this->startMarker->name)
        ->and($startMarkerArray['latitude'])->toBe($this->startMarker->latitude)
        ->and($startMarkerArray['longitude'])->toBe($this->startMarker->longitude);
});

it('includes all required marker fields in end_marker', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
    ]);

    $route->load(['startMarker', 'endMarker']);

    $resource = new RouteResource($route);
    $array = $resource->toArray(request());

    // Resolve the nested resource to array
    $endMarkerArray = $array['end_marker']->toArray(request());

    expect($endMarkerArray)->toHaveKeys(['id', 'name', 'latitude', 'longitude'])
        ->and($endMarkerArray['id'])->toBe($this->endMarker->id)
        ->and($endMarkerArray['name'])->toBe($this->endMarker->name)
        ->and($endMarkerArray['latitude'])->toBe($this->endMarker->latitude)
        ->and($endMarkerArray['longitude'])->toBe($this->endMarker->longitude);
});

it('includes formatted distance values from model accessors', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'distance' => 50000, // 50km
    ]);

    $route->load(['startMarker', 'endMarker']);

    $resource = new RouteResource($route);
    $array = $resource->toArray(request());

    expect($array['distance'])->toHaveKeys(['meters', 'km'])
        ->and($array['distance']['meters'])->toBe(50000)
        ->and($array['distance']['km'])->toBe(50.0);
});

it('includes formatted duration values from model accessors', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'duration' => 3600, // 1 hour = 60 minutes
    ]);

    $route->load(['startMarker', 'endMarker']);

    $resource = new RouteResource($route);
    $array = $resource->toArray(request());

    expect($array['duration'])->toHaveKeys(['seconds', 'minutes'])
        ->and($array['duration']['seconds'])->toBe(3600)
        ->and($array['duration']['minutes'])->toBe(60);
});

it('maintains complete route structure with all fields', function () {
    $route = Route::factory()->create([
        'trip_id' => $this->trip->id,
        'start_marker_id' => $this->startMarker->id,
        'end_marker_id' => $this->endMarker->id,
        'distance' => 50000,
        'duration' => 3600,
        'geometry' => ['coordinates' => [[0, 0], [1, 1]]],
        'warning' => 'Test warning',
    ]);

    $route->load(['startMarker', 'endMarker']);

    $resource = new RouteResource($route);
    $array = $resource->toArray(request());

    expect($array)->toHaveKeys([
        'id',
        'trip_id',
        'start_marker',
        'end_marker',
        'transport_mode',
        'distance',
        'duration',
        'geometry',
        'warning',
        'created_at',
        'updated_at',
    ]);
});
