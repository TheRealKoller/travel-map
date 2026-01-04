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

                    if ($tripId) {
                        $query = Tour::where('trip_id', $tripId)
                            ->whereRaw('LOWER(name) = ?', [strtolower($value)]);

                        if ($query->exists()) {
                            $fail('A tour with this name already exists for this trip.');
                        }
                    }
                },
            ],
            'trip_id' => 'required|integer|exists:trips,id',
        ];
    }
}
