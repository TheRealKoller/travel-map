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
        'parent_tour_id',
        'position',
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

    public function parentTour(): BelongsTo
    {
        return $this->belongsTo(Tour::class, 'parent_tour_id');
    }

    public function subTours(): HasMany
    {
        return $this->hasMany(Tour::class, 'parent_tour_id')
            ->orderBy('position', 'asc');
    }
}
