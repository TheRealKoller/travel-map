<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'country',
        'image_url',
        'unsplash_download_location',
        'viewport_latitude',
        'viewport_longitude',
        'viewport_zoom',
        'viewport_static_image_url',
        'planned_start_year',
        'planned_start_month',
        'planned_start_day',
        'planned_end_year',
        'planned_end_month',
        'planned_end_day',
        'planned_duration_days',
        'invitation_token',
        'notes',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markers(): HasMany
    {
        return $this->hasMany(Marker::class);
    }

    public function tours(): HasMany
    {
        return $this->hasMany(Tour::class);
    }

    public function routes(): HasMany
    {
        return $this->hasMany(Route::class);
    }

    public function sharedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'trip_user')
            ->withPivot('collaboration_role')
            ->withTimestamps();
    }

    /**
     * Check if a user has access to this trip (is owner or shared user).
     */
    public function hasAccess(User $user): bool
    {
        return $this->user_id === $user->id || $this->sharedUsers()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if a user is the owner of this trip.
     */
    public function isOwner(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    /**
     * Generate or refresh the invitation token for this trip.
     */
    public function generateInvitationToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $this->update(['invitation_token' => $token]);

        return $token;
    }

    /**
     * Get the invitation URL for this trip.
     */
    public function getInvitationUrl(): ?string
    {
        if (! $this->invitation_token) {
            return null;
        }

        return url("/trips/preview/{$this->invitation_token}");
    }
}
