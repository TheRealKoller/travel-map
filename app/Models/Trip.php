<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'invitation_role',
        'invitation_token_expires_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'invitation_token_expires_at' => 'datetime',
        ];
    }

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
     * Scope a query to trips accessible by a given user (owned or shared).
     */
    public function scopeAccessibleBy(Builder $query, User $user): Builder
    {
        return $query->where(function (Builder $accessQuery) use ($user) {
            $accessQuery->where('user_id', $user->id)
                ->orWhereHas('sharedUsers', function (Builder $q) use ($user) {
                    $q->where('user_id', $user->id);
                });
        });
    }

    /**
     * Check if a user has access to this trip (is owner or shared user).
     * Uses the already-loaded relation when available to avoid N+1 queries.
     */
    public function hasAccess(User $user): bool
    {
        if ($this->isOwner($user)) {
            return true;
        }

        if ($this->relationLoaded('sharedUsers')) {
            return $this->sharedUsers->contains($user);
        }

        return $this->sharedUsers()->where('user_id', $user->id)->exists();
    }

    /**
     * Check if a user has edit access to this trip (is owner, admin, or editor collaborator).
     * Viewers have read-only access and this method returns false for them.
     * Uses the already-loaded relation when available to avoid N+1 queries.
     */
    public function canEdit(User $user): bool
    {
        if ($user->isAdmin() || $this->isOwner($user)) {
            return true;
        }

        if ($this->relationLoaded('sharedUsers')) {
            $sharedUser = $this->sharedUsers->firstWhere('id', $user->id);

            return $sharedUser && $sharedUser->pivot->collaboration_role === 'editor';
        }

        return $this->sharedUsers()
            ->where('user_id', $user->id)
            ->where('collaboration_role', 'editor')
            ->exists();
    }

    public function isOwner(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    /**
     * Generate or refresh the invitation token for this trip.
     *
     * @param  \Carbon\Carbon|null  $expiresAt  Optional expiry timestamp
     */
    public function generateInvitationToken(?\Carbon\Carbon $expiresAt = null): string
    {
        $token = bin2hex(random_bytes(32));
        $this->update([
            'invitation_token' => $token,
            'invitation_token_expires_at' => $expiresAt,
        ]);

        return $token;
    }

    /**
     * Revoke the invitation token for this trip (sets token and expiry to null).
     */
    public function revokeInvitationToken(): void
    {
        $this->update([
            'invitation_token' => null,
            'invitation_token_expires_at' => null,
        ]);
    }

    /**
     * Check whether the invitation token has expired.
     */
    public function isInvitationTokenExpired(): bool
    {
        if ($this->invitation_token_expires_at === null) {
            return false;
        }

        return $this->invitation_token_expires_at->isPast();
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
