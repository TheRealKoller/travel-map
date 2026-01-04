<?php

namespace App\Http\Requests;

use App\Models\Tour;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTourRequest extends FormRequest
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
        $tour = $this->route('tour');
        $tourId = $tour->id;
        $tripId = $tour->trip_id;
        $parentTourId = $tour->parent_tour_id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($tourId, $tripId, $parentTourId) {
                    $query = Tour::where('trip_id', $tripId)
                        ->where('id', '!=', $tourId)
                        ->whereRaw('LOWER(name) = ?', [strtolower($value)]);
                    
                    // If updating a sub-tour, check uniqueness within parent tour only
                    if ($parentTourId) {
                        $query->where('parent_tour_id', $parentTourId);
                    } else {
                        // For top-level tours, check among other top-level tours
                        $query->whereNull('parent_tour_id');
                    }

                    if ($query->exists()) {
                        $fail($parentTourId 
                            ? 'A sub-tour with this name already exists in this tour.' 
                            : 'A tour with this name already exists for this trip.');
                    }
                },
            ],
        ];
    }
}
