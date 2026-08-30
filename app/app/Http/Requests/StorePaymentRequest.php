<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
            'marketplace_listing_id' => ['nullable', 'integer', 'exists:marketplace_listings,id'],
            'booking_id' => ['nullable', 'integer', 'exists:bookings,id'],
            'service_pricing_field_id' => ['nullable', 'string', 'exists:service_pricing_fields,id'],
            'agent_id' => ['nullable', 'string', 'exists:users,id'],
            'item_title' => ['required', 'string', 'max:255'],
            'payer_name' => ['required', 'string', 'max:255'],
            'payer_email' => ['required', 'email', 'max:255'],
            'amount' => ['required', 'numeric', 'min:1'],
            'currency' => ['nullable', 'string', 'max:10'],
            'payment_type' => ['required', 'string', 'max:255'],
        ];
    }
}
