<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Trip;

trait BuildsAdminOwnerProps
{
    /**
     * Build owner props for the admin banner when an admin views another user's trip.
     *
     * @return array{owner?: array{id: int, name: string}}
     */
    protected function buildAdminOwnerProps(Trip $trip): array
    {
        $user = auth()->user();

        if (! $user->isAdmin() || $trip->user_id === $user->id) {
            return [];
        }

        $trip->loadMissing('user:id,name');

        return [
            'owner' => [
                'id' => $trip->user->id,
                'name' => $trip->user->name,
            ],
        ];
    }
}
