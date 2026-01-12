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
            'start_marker' => new RouteMarkerResource($this->startMarker),
            'end_marker' => new RouteMarkerResource($this->endMarker),
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
            'transit_details' => $this->transit_details,
            'alternatives' => $this->alternatives,
            'warning' => $this->warning,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
