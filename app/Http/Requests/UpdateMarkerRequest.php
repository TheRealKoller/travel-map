<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMarkerRequest extends FormRequest
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
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|string',
            'notes' => 'sometimes|nullable|string',
            'url' => 'sometimes|nullable|url|max:2048',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'is_unesco' => 'sometimes|boolean',
            'ai_enriched' => 'sometimes|boolean',
            'planned_start_year' => 'sometimes|nullable|integer|min:1000|max:9999',
            'planned_start_month' => 'sometimes|nullable|integer|min:1|max:12',
            'planned_start_day' => 'sometimes|nullable|integer|min:1|max:31',
            'planned_end_year' => 'sometimes|nullable|integer|min:1000|max:9999',
            'planned_end_month' => 'sometimes|nullable|integer|min:1|max:12',
            'planned_end_day' => 'sometimes|nullable|integer|min:1|max:31',
            'planned_duration_days' => 'sometimes|nullable|integer|min:1|max:9999',
        ];
    }
}
