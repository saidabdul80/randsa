<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceFieldResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'label' => $this->label,
            'management_label' => $this->management_label,
            'field_type' => $this->field_type,
            'data_type' => $this->data_type,
            'placeholder' => $this->placeholder,
            'help_text' => $this->help_text,
            'default_value' => $this->default_value,
            'validation_rules' => $this->validation_rules,
            'is_system' => $this->is_system,
            'is_active' => $this->is_active,
            'options' => ServiceFieldOptionResource::collection($this->whenLoaded('options')),
        ];
    }
}
