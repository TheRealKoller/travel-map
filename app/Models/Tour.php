<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tour extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'trip_id',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function markers(): BelongsToMany
    {
        return $this->belongsToMany(Marker::class, 'marker_tour')
            ->withPivot('position')
            ->orderByPivot('position', 'asc')
            ->withTimestamps();
    }

    public function routes(): HasMany
    {
        return $this->hasMany(Route::class);
    }

    /**
     * Get the estimated total duration for this tour in hours.
     * Calculates: sum of marker estimated_hours + sum of route durations (converted to hours).
     * Missing values are treated as 0.
     */
    public function getEstimatedDurationHoursAttribute(): float
    {
        // Sum all marker estimated_hours
        $markerHours = $this->markers->sum('estimated_hours') ?? 0;

        // Sum all route durations (in seconds), convert to hours
        $routeSeconds = $this->routes->sum('duration') ?? 0;
        $routeHours = $routeSeconds / 3600;

        return round($markerHours + $routeHours, 2);
    }
}
