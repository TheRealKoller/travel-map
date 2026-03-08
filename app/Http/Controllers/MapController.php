<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    use AuthorizesRequests;

    public function show(Trip $trip): Response
    {
        $this->authorize('view', $trip);

        return Inertia::render('map', array_merge(
            [
                'trip' => [
                    'id' => $trip->id,
                ],
            ],
            $this->buildAdminOwnerProps($trip),
        ));
    }

    /**
     * Build owner props for the admin banner when an admin views another user's trip.
     *
     * @return array{owner?: array{id: int, name: string}}
     */
    private function buildAdminOwnerProps(Trip $trip): array
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
