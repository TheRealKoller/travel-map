<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTripRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'country' => 'nullable|string|size:2',
            'viewport_latitude' => 'nullable|numeric|between:-90,90',
            'viewport_longitude' => 'nullable|numeric|between:-180,180',
            'viewport_zoom' => 'nullable|numeric|between:0,22',
        ];
    }
}
