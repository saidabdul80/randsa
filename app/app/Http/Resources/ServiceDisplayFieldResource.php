<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceDisplayFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'service_field_id' => $this->service_field_id,
            'display_area' => $this->display_area,
            'label' => $this->label,
            'icon_key' => $this->icon_key,
            'format' => $this->format,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'field' => new ServiceFieldResource($this->whenLoaded('field')),
        ];
    }
}
