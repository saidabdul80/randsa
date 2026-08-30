<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewListingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'max:255'],
            'moderation_status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}
