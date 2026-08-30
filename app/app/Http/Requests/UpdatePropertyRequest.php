<?php

namespace App\Http\Requests;

class UpdatePropertyRequest extends StorePropertyRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'status' => ['nullable', 'string', 'max:255'],
            'is_available' => ['nullable', 'boolean'],
        ]);
    }
}
