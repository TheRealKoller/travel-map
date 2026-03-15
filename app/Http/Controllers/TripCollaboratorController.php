<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddTripCollaboratorRequest;
use App\Jobs\SendTripCollaboratorInvitationJob;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            ->select(['users.id', 'users.name', 'users.email', 'trip_user.collaboration_role', 'trip_user.created_at'])
            ->get();

        // Also include the owner
        $owner = [
            'id' => $trip->user->id,
            'name' => $trip->user->name,
            'email' => $trip->user->email,
            'collaboration_role' => 'owner',
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
        $this->authorize('manageCollaborators', $trip);

        $validated = $request->validated();
        $user = User::where('email', $validated['email'])->first();

        // Silently return success if the user does not exist
        if ($user === null) {
            return response()->json(['message' => 'Collaborator added successfully'], 201);
        }

        // Check if user is already the owner
        if ($trip->user_id === $user->id) {
            return response()->json(['error' => 'User is already the owner of this trip'], 422);
        }

        // Check if user is already a collaborator
        if ($trip->sharedUsers()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User is already a collaborator'], 422);
        }

        $role = $validated['role'] ?? 'editor';

        // Add the collaborator
        $trip->sharedUsers()->attach($user->id, [
            'collaboration_role' => $role,
        ]);

        // Dispatch the invitation email asynchronously
        $locale = in_array($request->cookie('language'), ['de', 'en'], true)
            ? $request->cookie('language')
            : 'de';

        SendTripCollaboratorInvitationJob::dispatch($trip, $user, $request->user(), $locale);

        return response()->json([
            'message' => 'Collaborator added successfully',
            'collaborator' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'collaboration_role' => $role,
            ],
        ], 201);
    }

    /**
     * Update a collaborator's role for a trip.
     */
    public function update(Request $request, Trip $trip, User $user): JsonResponse
    {
        $this->authorize('manageCollaborators', $trip);

        $validated = $request->validate([
            'role' => ['required', 'in:editor,viewer'],
        ]);

        // Cannot change the owner's role
        if ($trip->user_id === $user->id) {
            return response()->json(['error' => 'Cannot change the role of the trip owner'], 422);
        }

        // Ensure user is actually a collaborator
        if (! $trip->sharedUsers()->where('user_id', $user->id)->exists()) {
            return response()->json(['error' => 'User is not a collaborator on this trip'], 422);
        }

        $trip->sharedUsers()->updateExistingPivot($user->id, [
            'collaboration_role' => $validated['role'],
        ]);

        return response()->json(null, 204);
    }

    /**
     * Remove a collaborator from a trip.
     */
    public function destroy(Trip $trip, User $user): JsonResponse
    {
        $this->authorize('manageCollaborators', $trip);

        // Cannot remove the owner
        if ($trip->user_id === $user->id) {
            return response()->json(['error' => 'Cannot remove the trip owner'], 422);
        }

        // Remove the collaborator
        $trip->sharedUsers()->detach($user->id);

        return response()->json(null, 204);
    }
}
