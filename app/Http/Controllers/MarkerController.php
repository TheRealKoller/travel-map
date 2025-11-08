<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMarkerRequest;
use App\Http\Requests\UpdateMarkerRequest;
use App\Models\Marker;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class MarkerController extends Controller
{
    use AuthorizesRequests;

    public function index(): JsonResponse
    {
        $markers = auth()->user()->markers;

        return response()->json($markers);
    }

    public function store(StoreMarkerRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $marker = auth()->user()->markers()->create($validated);

        return response()->json($marker, 201);
    }

    public function update(UpdateMarkerRequest $request, Marker $marker): JsonResponse
    {
        $this->authorize('update', $marker);

        $validated = $request->validated();

        $marker->update($validated);

        return response()->json($marker);
    }

    public function destroy(Marker $marker): JsonResponse
    {
        $this->authorize('delete', $marker);

        $marker->delete();

        return response()->json(null, 204);
    }
}
