<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddTripCollaboratorRequest;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class TripCollaboratorController extends Controller
{
    use AuthorizesRequests;

    /**
     * List all collaborators for a trip.
     */
    public function index(Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        $collaborators = $trip->sharedUsers()
            ->select(['users.id', 'users.name', 'users.email', 'trip_user.role', 'trip_user.created_at'])
            ->get();

        // Also include the owner
        $owner = [
            'id' => $trip->user->id,
            'name' => $trip->user->name,
            'email' => $trip->user->email,
            'role' => 'owner',
            'created_at' => $trip->created_at,
        ];

        return response()->json([
            'owner' => $owner,
            'collaborators' => $collaborators,
        ]);
    }

    /**
     * Add a collaborator to a trip.
     */
    public function store(AddTripCollaboratorRequest $request, Trip $trip): JsonResponse
    {
        // Only the owner can add collaborators
        if (! $trip->isOwner(auth()->user())) {
            return response()->json(['error' => 'Only the trip owner can add collaborators'], 403);
        }

        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->firstOrFail();

        // Check if user is already the owner
        if ($trip->user_id === $user->id) {
            return response()->json(['error' => 'User is already the owner of this trip'], 422);
        }

        // Check if user is already a collaborator
        if ($trip->sharedUsers()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User is already a collaborator'], 422);
        }

        // Add the collaborator
        $trip->sharedUsers()->attach($user->id, [
            'role' => $validated['role'] ?? 'editor',
        ]);

        return response()->json([
            'message' => 'Collaborator added successfully',
            'collaborator' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $validated['role'] ?? 'editor',
            ],
        ], 201);
    }

    /**
     * Remove a collaborator from a trip.
     */
    public function destroy(Trip $trip, User $user): JsonResponse
    {
        // Only the owner can remove collaborators
        if (! $trip->isOwner(auth()->user())) {
            return response()->json(['error' => 'Only the trip owner can remove collaborators'], 403);
        }

        // Cannot remove the owner
        if ($trip->user_id === $user->id) {
            return response()->json(['error' => 'Cannot remove the trip owner'], 422);
        }

        // Remove the collaborator
        $trip->sharedUsers()->detach($user->id);

        return response()->json(null, 204);
    }
}
