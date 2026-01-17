<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTripRequest extends FormRequest
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
            'name' => 'sometimes|string|max:255',
            'viewport_latitude' => 'sometimes|nullable|numeric|between:-90,90',
            'viewport_longitude' => 'sometimes|nullable|numeric|between:-180,180',
            'viewport_zoom' => 'sometimes|nullable|numeric|between:0,22',
        ];
    }
}
