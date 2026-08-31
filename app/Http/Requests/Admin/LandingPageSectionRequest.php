<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LandingPageSectionRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'section_key' => ['required', 'string', Rule::in(['hero_slide', 'workflow_item', 'property_trust_item'])],
            'placement' => ['nullable', 'string', 'max:120'],
            'eyebrow' => ['nullable', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'action_label' => ['nullable', 'string', 'max:120'],
            'action_url' => ['nullable', 'string', 'max:2048'],
            'payload' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
