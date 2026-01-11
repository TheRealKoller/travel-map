<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MapboxRequest extends Model
{
    protected $fillable = [
        'period',
        'count',
        'last_request_at',
    ];

    protected $casts = [
        'last_request_at' => 'datetime',
    ];
}
