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

        $user = auth()->user();

        $props = [
            'trip' => [
                'id' => $trip->id,
                'name' => $trip->name,
            ],
            'canEdit' => $trip->canEdit($user),
        ];

        // Show owner banner when an admin is viewing another user's trip
        if ($user->isAdmin() && ! $trip->isOwner($user)) {
            $trip->loadMissing('user:id,name');

            $props['owner'] = [
                'id' => $trip->user->id,
                'name' => $trip->user->name,
            ];
        }

        return Inertia::render('map', $props);
    }
}
