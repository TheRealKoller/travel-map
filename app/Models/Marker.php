<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marker extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_unesco' => 'boolean',
        'ai_enriched' => 'boolean',
        'estimated_hours' => 'float',
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::deleting(function (Marker $marker) {
            // When a marker is soft deleted, also soft delete all associated routes
            if (! $marker->isForceDeleting()) {
                $marker->routesAsStart()->delete();
                $marker->routesAsEnd()->delete();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function tours(): BelongsToMany
    {
        return $this->belongsToMany(Tour::class, 'marker_tour')
            ->withPivot('position')
            ->orderByPivot('position', 'asc')
            ->withTimestamps();
    }

    public function routesAsStart(): HasMany
    {
        return $this->hasMany(Route::class, 'start_marker_id');
    }

    public function routesAsEnd(): HasMany
    {
        return $this->hasMany(Route::class, 'end_marker_id');
    }
}
