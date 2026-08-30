<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewAgentVerificationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['approved', 'rejected', 'pending'])],
            'admin_note' => ['nullable', 'string'],
        ];
    }
}
