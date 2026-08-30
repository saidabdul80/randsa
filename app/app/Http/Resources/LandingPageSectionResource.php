<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LandingPageSectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'section_key' => $this->section_key,
            'placement' => $this->placement,
            'eyebrow' => $this->eyebrow,
            'title' => $this->title,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'action_label' => $this->action_label,
            'action_url' => $this->action_url,
            'payload' => $this->payload,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
