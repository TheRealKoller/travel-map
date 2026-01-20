<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'country',
        'image_url',
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
}
