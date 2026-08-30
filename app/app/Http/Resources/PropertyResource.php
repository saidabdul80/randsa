<?php

namespace App\Http\Resources;

use App\Models\SavedItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewOwner = $request->user()?->id === $this->owner_id
            || (bool) $request->user()?->can('properties.moderate');

        $canViewPrivateLocation = $canViewOwner;
        $isSaved = array_key_exists('saved_by_current_user_exists', $this->resource->getAttributes())
            ? (bool) $this->saved_by_current_user_exists
            : ($request->user()
                ? SavedItem::query()
                    ->where('user_id', $request->user()->id)
                    ->where('item_type', 'property')
                    ->where('property_id', $this->id)
                    ->whereNull('marketplace_listing_id')
                    ->exists()
                : false);

        return [
            'id' => $this->id,
            'owner_id' => $this->when($canViewOwner, $this->owner_id),
            'service_category_id' => $this->service_category_id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'title' => $this->title,
            'description' => $this->description,
            'state' => $this->state,
            'city' => $this->city,
            'area' => $this->area,
            'address' => $this->when($canViewPrivateLocation, $this->address),
            'latitude' => $this->when($canViewPrivateLocation, $this->latitude),
            'longitude' => $this->when($canViewPrivateLocation, $this->longitude),
            'owner_phone' => $this->when($canViewOwner, $this->owner_phone),
            'status' => $this->status,
            'is_available' => $this->is_available,
            'is_saved' => $isSaved,
            'base_price' => $this->base_price,
            'currency' => $this->currency,
            'pricing_unit' => $this->pricing_unit,
            'limited_remaining_capacity' => $this->limited_remaining_capacity,
            'blocked_dates' => $this->blocked_dates,
            'buffer_minutes' => $this->buffer_minutes,
            'minimum_duration_minutes' => $this->minimum_duration_minutes,
            'category' => new ServiceCategoryResource($this->whenLoaded('category')),
            'sub_category' => new ServiceSubCategoryResource($this->whenLoaded('subCategory')),
            'owner' => $this->when($canViewOwner, fn () => new UserProfileResource($this->whenLoaded('owner'))),
            'field_values' => PropertyFieldValueResource::collection($this->whenLoaded('fieldValues')),
            'images' => PropertyImageResource::collection($this->whenLoaded('images')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
