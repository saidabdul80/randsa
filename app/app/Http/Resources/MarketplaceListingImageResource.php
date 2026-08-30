<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarketplaceListingImageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'storage_path' => $this->storage_path,
            'alt_text' => $this->alt_text,
            'sort_order' => $this->sort_order,
            'is_cover' => $this->is_cover,
        ];
    }
}
