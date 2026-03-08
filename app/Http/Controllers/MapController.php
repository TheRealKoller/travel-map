<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\BuildsAdminOwnerProps;
use App\Models\Trip;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    use AuthorizesRequests;
    use BuildsAdminOwnerProps;

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
}
