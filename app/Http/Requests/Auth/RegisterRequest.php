<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
            'nin' => ['nullable', 'string', 'max:255', 'unique:users,nin'],
            'bvn' => ['nullable', 'string', 'max:255', 'unique:users,bvn'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:40', 'unique:users,phone'],
            'location' => ['nullable', 'string', 'max:255'],
            'terms_accepted' => ['accepted'],
        ];
    }
}
