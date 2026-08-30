<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceSubCategoryFormConfigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'form_title' => $this->form_title,
            'short_label' => $this->short_label,
            'description_prompts' => $this->description_prompts,
            'suggested_amenities' => $this->suggested_amenities,
            'image_guidance' => $this->image_guidance,
            'default_payment_duration' => $this->default_payment_duration,
            'default_currency' => $this->default_currency,
            'default_country' => $this->default_country,
            'wizard_steps' => $this->wizard_steps,
            'quality_rules' => $this->quality_rules,
        ];
    }
}
