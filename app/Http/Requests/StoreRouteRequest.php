<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRouteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isNotManual = $this->input('transport_mode') !== 'manual-public-transport';

        return [
            'trip_id' => 'required|integer|exists:trips,id',
            'tour_id' => 'nullable|integer|exists:tours,id',
            'start_marker_id' => 'required|uuid|exists:markers,id',
            'end_marker_id' => 'required|uuid|exists:markers,id|different:start_marker_id',
            'transport_mode' => 'required|string|in:driving-car,cycling-regular,foot-walking,public-transport,manual-public-transport',
            'waypoints' => 'nullable|array|max:20',
            'waypoints.*.lat' => 'required_with:waypoints|numeric|between:-90,90',
            'waypoints.*.lng' => 'required_with:waypoints|numeric|between:-180,180',
            'transit_details' => ['nullable', 'array', Rule::prohibitedIf($isNotManual)],
            'transit_details.steps' => 'nullable|array',
            'transit_details.steps.*.travel_mode' => 'required_with:transit_details.steps|string|in:TRANSIT,WALK',
            'transit_details.steps.*.distance' => 'nullable|numeric|min:0',
            'transit_details.steps.*.duration' => 'nullable|numeric|min:0',
            'transit_details.steps.*.transit' => 'nullable|array',
            'transit_details.steps.*.transit.departure_stop' => 'nullable|array',
            'transit_details.steps.*.transit.departure_stop.name' => 'nullable|string|max:255',
            'transit_details.steps.*.transit.arrival_stop' => 'nullable|array',
            'transit_details.steps.*.transit.arrival_stop.name' => 'nullable|string|max:255',
            'transit_details.steps.*.transit.line' => 'nullable|array',
            'transit_details.steps.*.transit.line.name' => 'nullable|string|max:255',
            'transit_details.steps.*.transit.line.short_name' => 'nullable|string|max:50',
            'transit_details.steps.*.transit.line.vehicle_type' => 'nullable|string|max:50',
            'transit_details.steps.*.transit.line.color' => 'nullable|string|max:10',
            'transit_details.steps.*.transit.departure_time' => 'nullable|integer',
            'transit_details.steps.*.transit.arrival_time' => 'nullable|integer',
            'transit_details.steps.*.transit.num_stops' => 'nullable|integer|min:0',
            'transit_details.steps.*.transit.headsign' => 'nullable|string|max:255',
            'transit_details.departure_time' => 'nullable|string|max:50',
            'transit_details.arrival_time' => 'nullable|string|max:50',
            'transit_details.start_address' => 'nullable|string|max:500',
            'transit_details.end_address' => 'nullable|string|max:500',
        ];
    }
}
