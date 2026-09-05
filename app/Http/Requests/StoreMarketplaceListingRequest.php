<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMarketplaceListingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'service_category_id' => ['required', 'string', 'exists:service_categories,id'],
            'service_sub_category_id' => ['required', 'string', 'exists:service_sub_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'country' => ['nullable', 'string', 'max:255'],
            'state' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'area' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'currency' => ['nullable', 'string', 'max:10'],
            'base_price' => ['nullable', 'numeric', 'min:0'],
            'maximum_amount' => ['nullable', 'numeric', 'min:0'],
            'price_type' => ['nullable', 'string', 'max:255'],
            'billing_period' => ['nullable', 'string', 'max:255'],
            'negotiable' => ['nullable', 'boolean'],
            'contact_name' => ['required', 'string', 'max:255'],
            'contact_phone' => ['required', 'string', 'max:40'],
            'whatsapp_enabled' => ['nullable', 'boolean'],
            'preferred_contact_method' => ['nullable', 'string', 'max:255'],
            'delivery_available' => ['nullable', 'boolean'],
            'pickup_available' => ['nullable', 'boolean'],
            'delivery_details' => ['nullable', 'string'],
            'availability_slots' => ['nullable', 'array', 'max:180'],
            'availability_slots.*.date' => ['required_with:availability_slots', 'date_format:Y-m-d'],
            'availability_slots.*.time' => ['required_with:availability_slots', 'date_format:H:i'],
            'availability_slots.*.label' => ['nullable', 'string', 'max:80'],
            'availability_slots.*.capacity' => ['nullable', 'integer', 'min:1', 'max:100'],
            'availability_rules' => ['nullable', 'array', 'max:24'],
            'availability_rules.*.weekdays' => ['required_with:availability_rules', 'array', 'min:1', 'max:7'],
            'availability_rules.*.weekdays.*' => ['integer', 'between:0,6'],
            'availability_rules.*.times' => ['required_with:availability_rules', 'array', 'min:1', 'max:24'],
            'availability_rules.*.times.*' => ['date_format:H:i'],
            'availability_rules.*.label' => ['nullable', 'string', 'max:80'],
            'availability_rules.*.capacity' => ['nullable', 'integer', 'min:1', 'max:100'],
            'field_values' => ['nullable', 'array'],
            'field_values.*.service_field_id' => ['required_with:field_values', 'string', 'exists:service_fields,id'],
            'field_values.*.field_key' => ['nullable', 'string', 'max:255'],
            'field_values.*.value_string' => ['nullable', 'string'],
            'field_values.*.value_number' => ['nullable', 'numeric'],
            'field_values.*.value_boolean' => ['nullable', 'boolean'],
            'field_values.*.value_date' => ['nullable', 'date'],
            'field_values.*.value_json' => ['nullable', 'array'],
            'images' => ['nullable', 'array'],
            'images.*.url' => ['required_with:images', 'string', 'max:2048'],
            'images.*.storage_path' => ['nullable', 'string', 'max:255'],
            'images.*.alt_text' => ['nullable', 'string', 'max:255'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'images.*.is_cover' => ['nullable', 'boolean'],
            'image_files' => ['nullable', 'array', 'max:20'],
            'image_files.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'private_data.document_url' => ['nullable', 'url'],
            'private_data.document_type' => ['nullable', 'string', 'max:255'],
            'private_data.storage_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
