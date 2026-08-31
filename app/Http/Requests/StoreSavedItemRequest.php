<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSavedItemRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'item_type' => ['required', 'string', Rule::in(['property', 'listing'])],
            'property_id' => ['required_if:item_type,property', 'prohibited_if:item_type,listing', 'nullable', 'integer', 'exists:properties,id'],
            'marketplace_listing_id' => ['required_if:item_type,listing', 'prohibited_if:item_type,property', 'nullable', 'integer', 'exists:marketplace_listings,id'],
        ];
    }
}
