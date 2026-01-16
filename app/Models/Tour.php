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
}
