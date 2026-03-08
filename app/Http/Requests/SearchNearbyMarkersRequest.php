<?php

namespace App\Http\Requests;

use App\Enums\PlaceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SearchNearbyMarkersRequest extends FormRequest
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
            'latitude' => ['required', 'numeric', 'min:-90', 'max:90'],
            'longitude' => ['required', 'numeric', 'min:-180', 'max:180'],
            'radius_km' => ['required', 'integer', 'min:1', 'max:100'],
            'place_type' => ['nullable', Rule::enum(PlaceType::class)],
        ];
    }

    /**
     * Resolve the validated place type as an enum instance.
     */
    public function placeType(): ?PlaceType
    {
        $value = $this->validated('place_type');

        if ($value === null || $value === '') {
            return null;
        }

        return PlaceType::tryFrom($value);
    }
}
