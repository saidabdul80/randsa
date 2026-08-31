<?php

namespace App\Http\Requests\Admin;

use App\Enums\ListingTransactionType;
use App\Enums\ProviderKind;
use App\Enums\ServiceSubCategoryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceSubCategoryRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'id' => ['required', 'string', 'max:255'],
            'service_category_id' => ['required', 'string', 'exists:service_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'slug' => ['required', 'string', 'max:255'],
            'keywords' => ['nullable', 'array'],
            'type' => ['nullable', Rule::in(ServiceSubCategoryType::values())],
            'transaction_type' => ['nullable', Rule::in(ListingTransactionType::values())],
            'provider_kind' => ['nullable', Rule::in(ProviderKind::values())],
            'fulfillment_mode' => ['nullable', 'string', 'max:255'],
            'default_listing_table' => ['nullable', Rule::in(['properties', 'marketplace_listings'])],
            'default_status' => ['nullable', 'string', 'max:255'],
            'requires_moderation' => ['nullable', 'boolean'],
            'requires_provider_verification' => ['nullable', 'boolean'],
            'uses_service_area' => ['nullable', 'boolean'],
            'is_bookable' => ['nullable', 'boolean'],
            'is_payable' => ['nullable', 'boolean'],
            'allows_private_document' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }
}
