<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListingPriceRangeRequest extends FormRequest
{
    public function rules(): array
    {
        $id = $this->route('listingPriceRange')?->id;

        return [
            'id' => ['required', 'string', 'max:120', Rule::unique('listing_price_ranges', 'id')->ignore($id)],
            'label' => ['required', 'string', 'max:120'],
            'currency' => ['required', 'string', 'max:10'],
            'min_amount' => ['nullable', 'numeric', 'min:0'],
            'max_amount' => ['nullable', 'numeric', 'min:0', 'gte:min_amount'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }
}
