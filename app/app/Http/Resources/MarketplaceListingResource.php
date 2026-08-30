<?php

namespace App\Http\Resources;

use App\Models\SavedItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MarketplaceListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewOwner = $request->user()?->id === $this->owner_id
            || (bool) $request->user()?->can('marketplace-listings.moderate');

        $canViewPrivateLocation = $canViewOwner;
        $isSaved = array_key_exists('saved_by_current_user_exists', $this->resource->getAttributes())
            ? (bool) $this->saved_by_current_user_exists
            : ($request->user()
                ? SavedItem::query()
                    ->where('user_id', $request->user()->id)
                    ->where('item_type', 'listing')
                    ->where('marketplace_listing_id', $this->id)
                    ->whereNull('property_id')
                    ->exists()
                : false);

        return [
            'id' => $this->id,
            'owner_id' => $this->when($canViewOwner, $this->owner_id),
            'service_category_id' => $this->service_category_id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'moderation_status' => $this->moderation_status,
            'is_saved' => $isSaved,
            'location' => [
                'country' => $this->country,
                'state' => $this->state,
                'city' => $this->city,
                'area' => $this->area,
                'address' => $this->when($canViewPrivateLocation, $this->address),
                'latitude' => $this->when($canViewPrivateLocation, $this->latitude),
                'longitude' => $this->when($canViewPrivateLocation, $this->longitude),
            ],
            'pricing' => [
                'currency' => $this->currency,
                'amount' => $this->base_price,
                'maximum_amount' => $this->maximum_amount,
                'price_type' => $this->price_type,
                'billing_period' => $this->billing_period,
                'negotiable' => $this->negotiable,
            ],
            'contact' => [
                'name' => $this->contact_name,
                'phone' => $this->contact_phone,
                'whatsapp_enabled' => $this->whatsapp_enabled,
                'preferred_method' => $this->preferred_contact_method,
            ],
            'delivery' => [
                'available' => $this->delivery_available,
                'pickup_available' => $this->pickup_available,
                'details' => $this->delivery_details,
            ],
            'view_count' => $this->view_count,
            'favourite_count' => $this->favourite_count,
            'published_at' => $this->published_at,
            'category' => new ServiceCategoryResource($this->whenLoaded('category')),
            'sub_category' => new ServiceSubCategoryResource($this->whenLoaded('subCategory')),
            'owner' => $this->when($canViewOwner, fn () => new UserProfileResource($this->whenLoaded('owner'))),
            'field_values' => MarketplaceListingFieldValueResource::collection($this->whenLoaded('fieldValues')),
            'images' => MarketplaceListingImageResource::collection($this->whenLoaded('images')),
            'private_data' => new ListingPrivateDataResource($this->whenLoaded('privateData')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
