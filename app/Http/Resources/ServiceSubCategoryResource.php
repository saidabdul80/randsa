<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceSubCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_category_id' => $this->service_category_id,
            'name' => $this->name,
            'label' => $this->label,
            'description' => $this->description,
            'slug' => $this->slug,
            'keywords' => $this->keywords,
            'type' => $this->type,
            'transaction_type' => $this->transaction_type,
            'provider_kind' => $this->provider_kind,
            'fulfillment_mode' => $this->fulfillment_mode,
            'default_listing_table' => $this->default_listing_table,
            'default_status' => $this->default_status,
            'requires_moderation' => $this->requires_moderation,
            'requires_provider_verification' => $this->requires_provider_verification,
            'uses_service_area' => $this->uses_service_area,
            'is_bookable' => $this->is_bookable,
            'is_payable' => $this->is_payable,
            'allows_private_document' => $this->allows_private_document,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'is_public' => $this->is_public,
            'category' => new ServiceCategoryResource($this->whenLoaded('category')),
            'fields' => ServiceSubCategoryFieldResource::collection($this->whenLoaded('fieldLinks')),
            'form_config' => new ServiceSubCategoryFormConfigResource($this->whenLoaded('formConfig')),
            'pricing_fields' => ServicePricingFieldResource::collection($this->whenLoaded('pricingFields')),
            'media_rule' => new ServiceMediaRuleResource($this->whenLoaded('mediaRule')),
            'booking_config' => new ServiceBookingConfigResource($this->whenLoaded('bookingConfig')),
            'display_fields' => ServiceDisplayFieldResource::collection($this->whenLoaded('displayFields')),
            'filter_fields' => ServiceFilterFieldResource::collection($this->whenLoaded('filterFields')),
        ];
    }
}
