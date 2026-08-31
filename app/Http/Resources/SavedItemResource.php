<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SavedItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'item_type' => $this->item_type,
            'property_id' => $this->property_id,
            'marketplace_listing_id' => $this->marketplace_listing_id,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'marketplace_listing' => new MarketplaceListingResource($this->whenLoaded('marketplaceListing')),
            'created_at' => $this->created_at,
        ];
    }
}
