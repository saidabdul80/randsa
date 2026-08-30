<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAgentVerificationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:40'],
            'whatsapp_number' => ['required', 'string', 'max:40'],
            'office_address' => ['required', 'string', 'max:255'],
            'profile_photo' => ['required', 'array'],
            'id_document' => ['required', 'array'],
            'cac_document' => ['nullable', 'array'],
            'authorization_document' => ['required', 'array'],
        ];
    }
}
