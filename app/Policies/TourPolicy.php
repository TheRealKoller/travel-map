<?php

namespace App\Policies;

use App\Models\Tour;
use App\Models\User;

class TourPolicy
{
    /**
     * Determine whether the user can view any models.
     * Only admins can view all tours (for admin dashboard).
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Tour $tour): bool
    {
        return $this->canAccessTour($user, $tour);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Tour $tour): bool
    {
        return $this->canAccessTour($user, $tour);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Tour $tour): bool
    {
        return $this->canAccessTour($user, $tour);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Tour $tour): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Tour $tour): bool
    {
        return false;
    }

    /**
     * Check if a user can access a tour (admin or has access to the trip).
     */
    private function canAccessTour(User $user, Tour $tour): bool
    {
        // Admin has always access
        if ($user->isAdmin()) {
            return true;
        }

        // Check if user has access to the trip
        return $tour->trip->hasAccess($user);
    }
}
