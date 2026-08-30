<?php

namespace App\Http\Requests\Admin;

use App\Enums\ServiceCategoryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        $id = $this->route('serviceCategory')?->id;

        return [
            'id' => ['required', 'string', 'max:255', Rule::unique('service_categories', 'id')->ignore($id)],
            'name' => ['required', 'string', 'max:255'],
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('service_categories', 'slug')->ignore($id)],
            'type' => ['nullable', Rule::in(ServiceCategoryType::values())],
            'icon_key' => ['nullable', 'string', 'max:255'],
            'keywords' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }
}
