<?php

namespace App\Services;

use App\Models\Trip;
use App\Models\User;

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
}
