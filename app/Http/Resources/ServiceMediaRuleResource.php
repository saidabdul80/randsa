<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceMediaRuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'requires_images' => $this->requires_images,
            'min_images' => $this->min_images,
            'max_images' => $this->max_images,
            'allows_video' => $this->allows_video,
            'allowed_video_providers' => $this->allowed_video_providers,
            'allows_private_document' => $this->allows_private_document,
            'private_document_label' => $this->private_document_label,
            'private_document_required' => $this->private_document_required,
            'allowed_file_types' => $this->allowed_file_types,
            'max_file_size_mb' => $this->max_file_size_mb,
        ];
    }
}
