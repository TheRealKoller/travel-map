<?php

namespace App\Http\Requests;

use App\Models\Tour;
use Illuminate\Foundation\Http\FormRequest;

class StoreTourRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    $tripId = $this->input('trip_id');
                    $parentTourId = $this->input('parent_tour_id');
                    
                    if ($tripId) {
                        $query = Tour::where('trip_id', $tripId)
                            ->whereRaw('LOWER(name) = ?', [strtolower($value)]);
                        
                        // If creating a sub-tour, check uniqueness within parent tour only
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
                    }
                },
            ],
            'trip_id' => 'required|integer|exists:trips,id',
            'parent_tour_id' => 'nullable|integer|exists:tours,id',
        ];
    }
}
