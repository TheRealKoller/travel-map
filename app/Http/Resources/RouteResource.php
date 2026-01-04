<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RouteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'start_marker' => [
                'id' => $this->startMarker->id,
                'name' => $this->startMarker->name,
                'latitude' => $this->startMarker->latitude,
                'longitude' => $this->startMarker->longitude,
            ],
            'end_marker' => [
                'id' => $this->endMarker->id,
                'name' => $this->endMarker->name,
                'latitude' => $this->endMarker->latitude,
                'longitude' => $this->endMarker->longitude,
            ],
            'transport_mode' => [
                'value' => $this->transport_mode->value,
                'label' => $this->transport_mode->label(),
            ],
            'distance' => [
                'meters' => $this->distance,
                'km' => $this->distance_in_km,
            ],
            'duration' => [
                'seconds' => $this->duration,
                'minutes' => $this->duration_in_minutes,
            ],
            'geometry' => $this->geometry,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
