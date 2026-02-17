<?php

namespace App\Policies;

use App\Models\Marker;
use App\Models\User;

class MarkerPolicy
{
    /**
     * Determine whether the user can view any models.
     * Only admins can view all markers (for admin dashboard).
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Marker $marker): bool
    {
        return $this->canAccessMarker($user, $marker);
    }

    /**
     * Determine whether the user can create models.
     * Disabled as markers are created directly through user relationship.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Marker $marker): bool
    {
        return $this->canAccessMarker($user, $marker);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Marker $marker): bool
    {
        return $this->canAccessMarker($user, $marker);
    }

    /**
     * Determine whether the user can restore the model.
     * Disabled as soft deletes are not used for markers.
     */
    public function restore(User $user, Marker $marker): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     * Disabled as soft deletes are not used for markers.
     */
    public function forceDelete(User $user, Marker $marker): bool
    {
        return false;
    }

    /**
     * Check if a user can access a marker (either owns it or has access to its trip).
     */
    private function canAccessMarker(User $user, Marker $marker): bool
    {
        // Admin has always access
        if ($user->isAdmin()) {
            return true;
        }

        // Check if user owns the marker directly
        if ($user->id === $marker->user_id) {
            return true;
        }

        // If marker belongs to a trip, check if user has access to that trip
        if ($marker->trip_id && $marker->trip) {
            return $marker->trip->hasAccess($user);
        }

        return false;
    }
}
