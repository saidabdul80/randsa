<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'customer_name' => [Rule::requiredIf(fn (): bool => ! $this->user()), 'nullable', 'string', 'max:255'],
            'customer_email' => [Rule::requiredIf(fn (): bool => ! $this->user()), 'nullable', 'email', 'max:255'],
            'customer_phone' => [Rule::requiredIf(fn (): bool => ! $this->user()), 'nullable', 'string', 'max:40'],
            'notes' => ['nullable', 'string'],
            'redirect_to' => ['nullable', 'string', Rule::in(['back', 'bookings'])],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->user()
                    || $validator->errors()->has('customer_email')
                    || $validator->errors()->has('customer_phone')
                    || ! $this->filled('customer_phone')
                    || ! $this->filled('customer_email')) {
                    return;
                }

                $emailBelongsToExistingUser = User::query()
                    ->where('email', (string) $this->string('customer_email'))
                    ->exists();

                if ($emailBelongsToExistingUser) {
                    $validator->errors()->add('customer_email', 'The email is already attached to an account. Please log in to continue.');

                    return;
                }

                $phoneBelongsToAnotherUser = User::query()
                    ->where('phone', (string) $this->string('customer_phone'))
                    ->exists();

                if ($phoneBelongsToAnotherUser) {
                    $validator->errors()->add('customer_phone', 'The phone number is already attached to another account.');
                }
            },
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_name' => 'name',
            'customer_email' => 'email',
            'customer_phone' => 'phone',
        ];
    }
}
