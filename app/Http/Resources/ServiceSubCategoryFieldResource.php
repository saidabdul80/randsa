<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceSubCategoryFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'service_field_id' => $this->service_field_id,
            'field_group' => $this->field_group,
            'section_label' => $this->section_label,
            'is_required' => $this->is_required,
            'is_filterable' => $this->is_filterable,
            'is_searchable' => $this->is_searchable,
            'is_displayed_on_card' => $this->is_displayed_on_card,
            'is_displayed_on_details' => $this->is_displayed_on_details,
            'sort_order' => $this->sort_order,
            'min_value' => $this->min_value,
            'max_value' => $this->max_value,
            'min_length' => $this->min_length,
            'max_length' => $this->max_length,
            'visibility_condition' => $this->visibility_condition,
            'clearing_group' => $this->clearing_group,
            'field' => new ServiceFieldResource($this->whenLoaded('field')),
        ];
    }
}
