<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'property_id' => $this->property_id,
            'marketplace_listing_id' => $this->marketplace_listing_id,
            'service_category_id' => $this->service_category_id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'booking_config_id' => $this->booking_config_id,
            'agent_id' => $this->agent_id,
            'booking_mode' => $this->booking_mode,
            'inspection_date' => $this->inspection_date,
            'inspection_time' => $this->inspection_time,
            'start_at' => $this->start_at,
            'end_at' => $this->end_at,
            'duration_minutes' => $this->duration_minutes,
            'quantity' => $this->quantity,
            'pricing_unit' => $this->pricing_unit,
            'estimated_total' => $this->estimated_total,
            'category_details' => $this->category_details,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'reminder_sent' => $this->reminder_sent,
            'guest_phone' => $this->guest_phone,
            'notes' => $this->notes,
            'request_id' => $this->request_id,
            'schema_version' => $this->schema_version,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'marketplace_listing' => new MarketplaceListingResource($this->whenLoaded('marketplaceListing')),
            'agent' => new UserProfileResource($this->whenLoaded('agent')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
