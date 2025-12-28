<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Models\Trip;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class TripController extends Controller
{
    use AuthorizesRequests;

    public function index(): JsonResponse
    {
        $trips = auth()->user()->trips()->orderBy('created_at', 'asc')->get();

        return response()->json($trips);
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $trip = auth()->user()->trips()->create($validated);

        return response()->json($trip, 201);
    }

    public function show(Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        return response()->json($trip);
    }

    public function update(UpdateTripRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('update', $trip);

        $validated = $request->validated();

        $trip->update($validated);

        return response()->json($trip);
    }

    public function destroy(Trip $trip): JsonResponse
    {
        $this->authorize('delete', $trip);

        $trip->delete();

        return response()->json(null, 204);
    }
}
