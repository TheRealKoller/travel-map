<?php

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;
use App\Models\User;
use App\Services\TourMarkerService;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
    $this->trip = Trip::factory()->create(['user_id' => $this->user->id]);
    $this->tour = Tour::factory()->create(['trip_id' => $this->trip->id]);
    $this->tourMarkerService = app(TourMarkerService::class);
});

test('attachMarkerToTour attaches marker with correct position', function () {
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $result = $this->tourMarkerService->attachMarkerToTour($marker, $this->tour->id, $this->trip);

    expect($result)->toBeTrue();

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $this->tour->id,
        'position' => 0,
    ]);
});

test('attachMarkerToTour assigns next position when tour has existing markers', function () {
    $existingMarker1 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);
    $existingMarker2 = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $this->tour->markers()->attach($existingMarker1->id, ['position' => 0]);
    $this->tour->markers()->attach($existingMarker2->id, ['position' => 1]);

    $newMarker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $result = $this->tourMarkerService->attachMarkerToTour($newMarker, $this->tour->id, $this->trip);

    expect($result)->toBeTrue();

    $this->assertDatabaseHas('marker_tour', [
        'marker_id' => $newMarker->id,
        'tour_id' => $this->tour->id,
        'position' => 2,
    ]);
});

test('attachMarkerToTour returns false when tour does not exist', function () {
    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $result = $this->tourMarkerService->attachMarkerToTour($marker, 99999, $this->trip);

    expect($result)->toBeFalse();

    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $marker->id,
    ]);
});

test('attachMarkerToTour returns false when tour belongs to different trip', function () {
    $otherTrip = Trip::factory()->create(['user_id' => $this->user->id]);
    $otherTour = Tour::factory()->create(['trip_id' => $otherTrip->id]);

    $marker = Marker::factory()->create([
        'trip_id' => $this->trip->id,
        'user_id' => $this->user->id,
    ]);

    $result = $this->tourMarkerService->attachMarkerToTour($marker, $otherTour->id, $this->trip);

    expect($result)->toBeFalse();

    $this->assertDatabaseMissing('marker_tour', [
        'marker_id' => $marker->id,
        'tour_id' => $otherTour->id,
    ]);
});
