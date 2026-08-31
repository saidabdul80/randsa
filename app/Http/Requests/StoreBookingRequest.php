<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
            'marketplace_listing_id' => ['nullable', 'integer', 'exists:marketplace_listings,id'],
            'service_category_id' => ['required', 'string', 'exists:service_categories,id'],
            'service_sub_category_id' => ['required', 'string', 'exists:service_sub_categories,id'],
            'booking_config_id' => ['nullable', 'string', 'exists:service_booking_configs,id'],
            'agent_id' => ['nullable', 'string', 'exists:users,id'],
            'booking_mode' => ['nullable', 'string', 'max:255'],
            'inspection_date' => ['nullable', 'date'],
            'inspection_time' => ['nullable', 'string', 'max:255'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'pricing_unit' => ['nullable', 'string', 'max:255'],
            'estimated_total' => ['nullable', 'numeric', 'min:0'],
            'category_details' => ['nullable', 'array'],
            'guest_phone' => ['nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
