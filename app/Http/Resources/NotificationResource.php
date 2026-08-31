<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'channel' => $this->channel,
            'property_id' => $this->property_id,
            'marketplace_listing_id' => $this->marketplace_listing_id,
            'booking_id' => $this->booking_id,
            'payment_id' => $this->payment_id,
            'delivered_at' => $this->delivered_at,
            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }
}
