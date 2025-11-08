<?php

namespace App\Http\Controllers;

use App\Models\Marker;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class MarkerController extends Controller
{
    use AuthorizesRequests;
    public function index()
    {
        $markers = auth()->user()->markers;
        
        return response()->json($markers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'type' => 'required|string',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $marker = auth()->user()->markers()->create($validated);

        return response()->json($marker, 201);
    }

    public function update(Request $request, Marker $marker)
    {
        $this->authorize('update', $marker);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
        ]);

        $marker->update($validated);

        return response()->json($marker);
    }

    public function destroy(Marker $marker)
    {
        $this->authorize('delete', $marker);

        $marker->delete();

        return response()->json(null, 204);
    }
}
