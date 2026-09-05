<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Models\Receipt;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreReceiptRequest extends FormRequest
{
    private ?Booking $receiptBooking = null;

    public function authorize(): bool
    {
        return (bool) $this->user()?->can('create', Receipt::class);
    }

    public function rules(): array
    {
        return [
            'booking_id' => ['required', 'integer', 'exists:bookings,id'],
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
            'marketplace_listing_id' => ['nullable', 'integer', 'exists:marketplace_listings,id'],
            'receipt_type' => ['required', 'string', 'in:rent,service,inspection,deposit,agency_fee,service_charge,other'],
            'amount' => ['required', 'numeric', 'min:1'],
            'currency' => ['nullable', 'string', 'max:10'],
            'payment_method' => ['required', 'string', 'in:bank_transfer,cash,pos,card,cheque,online,other'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'paid_at' => ['required', 'date'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date', 'after_or_equal:period_start'],
            'item_description' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'send_email' => ['nullable', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('booking_id') || ! $this->user()) {
                    return;
                }

                $booking = Booking::query()
                    ->with(['property', 'marketplaceListing', 'user'])
                    ->find($this->integer('booking_id'));

                if (! $booking) {
                    return;
                }

                $ownsProperty = $booking->property?->owner_id === $this->user()->id;
                $ownsListing = $booking->marketplaceListing?->owner_id === $this->user()->id;
                $selectedPropertyId = $this->integer('property_id') ?: null;
                $selectedListingId = $this->integer('marketplace_listing_id') ?: null;

                if (! $ownsProperty && ! $ownsListing && ! $this->user()->can('payments.manage')) {
                    $validator->errors()->add('booking_id', 'You can only issue receipts for bookings on your own posts.');

                    return;
                }

                if (! $selectedPropertyId && ! $selectedListingId) {
                    $validator->errors()->add('property_id', 'Select the post this receipt belongs to.');

                    return;
                }

                if ($selectedPropertyId && $selectedListingId) {
                    $validator->errors()->add('property_id', 'Select one post for this receipt.');

                    return;
                }

                if ($selectedPropertyId && $booking->property_id !== $selectedPropertyId) {
                    $validator->errors()->add('booking_id', 'The selected customer booking does not belong to the selected housing post.');

                    return;
                }

                if ($selectedListingId && $booking->marketplace_listing_id !== $selectedListingId) {
                    $validator->errors()->add('booking_id', 'The selected customer booking does not belong to the selected service post.');

                    return;
                }

                if (! $booking->user || ! $booking->customer_email) {
                    $validator->errors()->add('booking_id', 'This booking does not have a customer email for receipt delivery.');

                    return;
                }

                $this->receiptBooking = $booking;
            },
        ];
    }

    public function receiptBooking(): Booking
    {
        return $this->receiptBooking
            ?? Booking::query()->with(['property', 'marketplaceListing', 'user'])->findOrFail($this->integer('booking_id'));
    }

    public function attributes(): array
    {
        return [
            'booking_id' => 'customer booking',
            'property_id' => 'housing post',
            'marketplace_listing_id' => 'service post',
            'receipt_type' => 'receipt type',
            'paid_at' => 'payment date',
            'period_start' => 'period start',
            'period_end' => 'period end',
        ];
    }
}
