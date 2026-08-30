<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyFieldValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_field_id' => $this->service_field_id,
            'field_key' => $this->field_key,
            'value_string' => $this->value_string,
            'value_number' => $this->value_number,
            'value_boolean' => $this->value_boolean,
            'value_date' => $this->value_date,
            'value_json' => $this->value_json,
            'field' => new ServiceFieldResource($this->whenLoaded('field')),
        ];
    }
}
