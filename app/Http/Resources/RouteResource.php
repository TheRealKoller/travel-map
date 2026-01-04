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
                'lat' => $this->startMarker->lat,
                'lng' => $this->startMarker->lng,
            ],
            'end_marker' => [
                'id' => $this->endMarker->id,
                'name' => $this->endMarker->name,
                'lat' => $this->endMarker->lat,
                'lng' => $this->endMarker->lng,
            ],
            'transport_mode' => $this->transport_mode->value,
            'transport_mode_label' => $this->transport_mode->label(),
            'distance' => $this->distance,
            'distance_km' => $this->distance_in_km,
            'duration' => $this->duration,
            'duration_minutes' => $this->duration_in_minutes,
            'geometry' => $this->geometry,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
