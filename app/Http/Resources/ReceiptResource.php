<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReceiptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'receipt_number' => $this->receipt_number,
            'owner_id' => $this->owner_id,
            'user_id' => $this->user_id,
            'booking_id' => $this->booking_id,
            'property_id' => $this->property_id,
            'marketplace_listing_id' => $this->marketplace_listing_id,
            'payment_id' => $this->payment_id,
            'receipt_type' => $this->receipt_type,
            'status' => $this->status,
            'item_title' => $this->item_title,
            'issuer_name' => $this->issuer_name,
            'issuer_email' => $this->issuer_email,
            'issuer_phone' => $this->issuer_phone,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'property_address' => $this->property_address,
            'line_items' => $this->line_items,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'payment_method' => $this->payment_method,
            'payment_reference' => $this->payment_reference,
            'period_start' => $this->period_start,
            'period_end' => $this->period_end,
            'paid_at' => $this->paid_at,
            'issued_at' => $this->issued_at,
            'sent_at' => $this->sent_at,
            'notes' => $this->notes,
            'owner' => new UserProfileResource($this->whenLoaded('owner')),
            'user' => new UserProfileResource($this->whenLoaded('user')),
            'booking' => new BookingResource($this->whenLoaded('booking')),
            'property' => new PropertyResource($this->whenLoaded('property')),
            'marketplace_listing' => new MarketplaceListingResource($this->whenLoaded('marketplaceListing')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
