<?php

namespace App\Models;

use App\Enums\TransportMode;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Route extends Model
{
    /** @use HasFactory<\Database\Factories\RouteFactory> */
    use HasFactory;

    protected $fillable = [
        'trip_id',
        'start_marker_id',
        'end_marker_id',
        'transport_mode',
        'distance',
        'duration',
        'geometry',
        'warning',
    ];

    protected function casts(): array
    {
        return [
            'transport_mode' => TransportMode::class,
            'geometry' => 'array',
            'distance' => 'integer',
            'duration' => 'integer',
        ];
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function startMarker(): BelongsTo
    {
        return $this->belongsTo(Marker::class, 'start_marker_id');
    }

    public function endMarker(): BelongsTo
    {
        return $this->belongsTo(Marker::class, 'end_marker_id');
    }

    /**
     * Get distance in kilometers.
     */
    public function getDistanceInKmAttribute(): float
    {
        return round($this->distance / 1000, 2);
    }

    /**
     * Get duration in minutes.
     */
    public function getDurationInMinutesAttribute(): int
    {
        return (int) round($this->duration / 60);
    }
}
