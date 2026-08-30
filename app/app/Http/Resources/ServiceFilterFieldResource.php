<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceFilterFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_category_id' => $this->service_category_id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'service_field_id' => $this->service_field_id,
            'filter_label' => $this->filter_label,
            'filter_type' => $this->filter_type,
            'operator' => $this->operator,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'field' => new ServiceFieldResource($this->whenLoaded('field')),
        ];
    }
}
