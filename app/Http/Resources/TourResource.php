<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Ensure sub-tours have their markers loaded
        $this->loadMissing('subTours.markers');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'trip_id' => $this->trip_id,
            'parent_tour_id' => $this->parent_tour_id,
            'position' => $this->position,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'markers' => $this->whenLoaded('markers', function () {
                return $this->markers->map(function ($marker) {
                    return [
                        'id' => $marker->id,
                        'name' => $marker->name,
                        'lat' => $marker->lat,
                        'lng' => $marker->lng,
                        'latitude' => $marker->lat, // For backward compatibility
                        'longitude' => $marker->lng, // For backward compatibility
                        'type' => $marker->type,
                        'notes' => $marker->notes,
                        'url' => $marker->url,
                        'is_unesco' => $marker->is_unesco,
                        'trip_id' => $marker->trip_id,
                        'created_at' => $marker->created_at,
                        'updated_at' => $marker->updated_at,
                        'position' => $marker->pivot->position ?? 0,
                    ];
                });
            }, collect()),
            'sub_tours' => $this->whenLoaded('subTours', function () {
                return TourResource::collection($this->subTours);
            }, collect()),
        ];
    }
}
