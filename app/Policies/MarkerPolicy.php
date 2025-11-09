<?php

namespace App\Policies;

use App\Models\Marker;
use App\Models\User;

class MarkerPolicy
{
    /**
     * Determine whether the user can view any models.
     * Disabled as markers are fetched directly through user relationship.
     */
    public function viewAny(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can view the model.
     * Disabled as markers are fetched directly through user relationship.
     */
    public function view(User $user, Marker $marker): bool
    {
        return false;
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
        return $user->id === $marker->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Marker $marker): bool
    {
        return $user->id === $marker->user_id;
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
}
