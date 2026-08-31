<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'middle_name' => $this->filled('middle_name') ? $this->input('middle_name') : null,
            'nin' => $this->filled('nin') ? $this->input('nin') : null,
            'bvn' => $this->filled('bvn') ? $this->input('bvn') : null,
            'phone' => $this->filled('phone') ? $this->input('phone') : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'nin' => ['nullable', 'string', 'max:255', Rule::unique('users', 'nin')->ignore($this->user()?->id)],
            'bvn' => ['nullable', 'string', 'max:255', Rule::unique('users', 'bvn')->ignore($this->user()?->id)],
            'phone' => ['nullable', 'string', 'max:40', Rule::unique('users', 'phone')->ignore($this->user()?->id)],
            'location' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'photo_url' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
