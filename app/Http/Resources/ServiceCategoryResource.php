<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceCategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'label' => $this->label,
            'description' => $this->description,
            'slug' => $this->slug,
            'type' => $this->type,
            'icon_key' => $this->icon_key,
            'keywords' => $this->keywords,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'is_public' => $this->is_public,
            'sub_categories' => ServiceSubCategoryResource::collection($this->whenLoaded('subCategories')),
        ];
    }
}
