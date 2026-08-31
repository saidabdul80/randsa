<?php

namespace App\Actions\MarketplaceListings;

use App\Events\MarketplaceListingSubmitted;
use App\Models\MarketplaceListing;
use App\Models\User;
use App\Support\DynamicFieldValueSynchronizer;
use App\Support\ImageSynchronizer;
use App\Support\ListingPrivateDataSynchronizer;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class StoreMarketplaceListingAction
{
    public function __construct(
        private readonly DynamicFieldValueSynchronizer $fields,
        private readonly ImageSynchronizer $images,
        private readonly ListingPrivateDataSynchronizer $privateData,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(User $owner, array $data): MarketplaceListing
    {
        return DB::transaction(function () use ($owner, $data): MarketplaceListing {
            $listing = MarketplaceListing::query()->create(array_merge(
                Arr::except($data, ['field_values', 'images', 'private_data']),
                [
                    'owner_id' => $owner->id,
                    'status' => 'pending_review',
                    'moderation_status' => 'pending',
                ],
            ));

            $this->fields->syncMarketplaceListing($listing, $data['field_values'] ?? []);
            $this->images->replace($listing->images(), $data['images'] ?? []);
            $this->privateData->sync($listing, $data['private_data'] ?? null);

            MarketplaceListingSubmitted::dispatch($listing);

            return $listing;
        });
    }
}
