<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMarkerRequest extends FormRequest
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
            'id' => 'required|uuid',
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'notes' => 'nullable|string',
            'url' => 'nullable|url|max:2048',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'trip_id' => 'nullable|integer|exists:trips,id',
            'is_unesco' => 'boolean',
            'ai_enriched' => 'boolean',
            'planned_start_year' => 'nullable|integer|min:1000|max:9999',
            'planned_start_month' => 'nullable|integer|min:1|max:12',
            'planned_start_day' => 'nullable|integer|min:1|max:31',
            'planned_end_year' => 'nullable|integer|min:1000|max:9999',
            'planned_end_month' => 'nullable|integer|min:1|max:12',
            'planned_end_day' => 'nullable|integer|min:1|max:31',
            'planned_duration_days' => 'nullable|integer|min:1|max:9999',
        ];
    }
}
