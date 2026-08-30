<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ListingPrivateDataResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'listing_id' => $this->listing_id,
            'owner_id' => $this->owner_id,
            'document_url' => $this->document_url,
            'document_type' => $this->document_type,
            'storage_path' => $this->storage_path,
        ];
    }
}
