<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ServiceFieldRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'id' => ['required', 'string', 'max:255'],
            'key' => ['required', 'string', 'max:255'],
            'label' => ['required', 'string', 'max:255'],
            'management_label' => ['nullable', 'string', 'max:255'],
            'field_type' => ['required', 'string', 'max:255'],
            'data_type' => ['required', 'string', 'max:255'],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'help_text' => ['nullable', 'string'],
            'default_value' => ['nullable', 'array'],
            'validation_rules' => ['nullable', 'array'],
            'is_system' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'options' => ['nullable', 'array'],
            'options.*.id' => ['required_with:options', 'string', 'max:255'],
            'options.*.value' => ['required_with:options', 'string', 'max:255'],
            'options.*.label' => ['required_with:options', 'string', 'max:255'],
            'options.*.description' => ['nullable', 'string'],
            'options.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'options.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}
