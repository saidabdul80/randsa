<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServicePricingFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'key' => $this->key,
            'label' => $this->label,
            'description' => $this->description,
            'amount_type' => $this->amount_type,
            'is_required' => $this->is_required,
            'is_payable' => $this->is_payable,
            'payment_type' => $this->payment_type,
            'default_amount' => $this->default_amount,
            'minimum_amount' => $this->minimum_amount,
            'maximum_amount' => $this->maximum_amount,
            'currency' => $this->currency,
            'pricing_unit' => $this->pricing_unit,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
