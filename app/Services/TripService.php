<?php

namespace App\Services;

use App\Models\Marker;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class TripService
{
    public function ensureDefaultTrip(User $user): Trip
    {
        $trip = $user->trips()->first();

        if (! $trip) {
            $trip = $user->trips()->create([
                'name' => 'Default',
            ]);
        }

        return $trip;
    }

    public function getActiveTrip(User $user, ?int $tripId = null): Trip
    {
        if ($tripId) {
            $trip = $user->trips()->find($tripId);
            if ($trip) {
                return $trip;
            }
        }

        return $this->ensureDefaultTrip($user);
    }

    /**
     * Find a trip for a specific user.
     *
     * @throws ModelNotFoundException If the trip is not found
     * @throws AuthorizationException If the trip does not belong to the user
     */
    public function findTripForUser(User $user, int $tripId): Trip
    {
        $trip = Trip::findOrFail($tripId);

        if ($trip->user_id !== $user->id) {
            throw new AuthorizationException('This action is unauthorized.');
        }

        return $trip;
    }

    /**
     * Assert that all given markers belong to the specified trip.
     *
     * @return bool Returns true if all markers belong to the trip
     */
    public function assertMarkersBelongToTrip(Trip $trip, Marker ...$markers): bool
    {
        foreach ($markers as $marker) {
            if ($marker->trip_id !== $trip->id) {
                return false;
            }
        }

        return true;
    }
}
