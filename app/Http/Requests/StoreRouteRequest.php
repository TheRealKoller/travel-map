<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'trip_id' => 'required|integer|exists:trips,id',
            'tour_id' => 'nullable|integer|exists:tours,id',
            'start_marker_id' => 'required|uuid|exists:markers,id',
            'end_marker_id' => 'required|uuid|exists:markers,id|different:start_marker_id',
            'transport_mode' => 'required|string|in:driving-car,cycling-regular,foot-walking,public-transport',
        ];
    }
}
