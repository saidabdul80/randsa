<?php

namespace App\Http\Requests;

class UpdateMarketplaceListingRequest extends StoreMarketplaceListingRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'status' => ['nullable', 'string', 'max:255'],
            'moderation_status' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
