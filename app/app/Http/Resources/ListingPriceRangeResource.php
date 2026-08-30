<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingPriceRangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'currency' => $this->currency,
            'min_amount' => $this->min_amount,
            'max_amount' => $this->max_amount,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'is_public' => $this->is_public,
        ];
    }
}
