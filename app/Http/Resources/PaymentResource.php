<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'property_id' => $this->property_id,
            'marketplace_listing_id' => $this->marketplace_listing_id,
            'booking_id' => $this->booking_id,
            'service_pricing_field_id' => $this->service_pricing_field_id,
            'agent_id' => $this->agent_id,
            'item_title' => $this->item_title,
            'payer_name' => $this->payer_name,
            'payer_email' => $this->payer_email,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'payment_type' => $this->payment_type,
            'paystack_reference' => $this->paystack_reference,
            'status' => $this->status,
            'verification_mode' => $this->verification_mode,
            'gateway' => $this->gateway,
            'verified_at' => $this->verified_at,
            'booking' => new BookingResource($this->whenLoaded('booking')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
