<?php

namespace App\Services;

use App\Models\Marker;
use App\Models\Tour;
use App\Models\Trip;

class TourMarkerService
{
    /**
     * Attach a marker to a tour with automatic position assignment.
     *
     * @param  Marker  $marker  The marker to attach
     * @param  int  $tourId  The ID of the tour
     * @param  Trip  $trip  The trip that should own the tour
     * @return bool Returns true if the marker was attached, false otherwise
     */
    public function attachMarkerToTour(Marker $marker, int $tourId, Trip $trip): bool
    {
        $tour = Tour::find($tourId);

        if (! $tour || $tour->trip_id !== $trip->id) {
            return false;
        }

        $maxPosition = $tour->markers()->max('position') ?? -1;
        $tour->markers()->attach($marker->id, ['position' => $maxPosition + 1]);

        return true;
    }
}
