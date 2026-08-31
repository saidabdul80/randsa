<?php

namespace App\Actions\MarketplaceListings;

use App\Models\MarketplaceListing;
use App\Models\User;
use App\Support\DynamicFieldValueSynchronizer;
use App\Support\ImageSynchronizer;
use App\Support\ListingPrivateDataSynchronizer;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class UpdateMarketplaceListingAction
{
    public function __construct(
        private readonly DynamicFieldValueSynchronizer $fields,
        private readonly ImageSynchronizer $images,
        private readonly ListingPrivateDataSynchronizer $privateData,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(MarketplaceListing $listing, User $actor, array $data): MarketplaceListing
    {
        return DB::transaction(function () use ($listing, $actor, $data): MarketplaceListing {
            $payload = Arr::except($data, ['field_values', 'images', 'private_data']);

            if (! $actor->can('marketplace-listings.moderate')) {
                unset($payload['status'], $payload['moderation_status']);
                $payload['status'] = 'pending_review';
                $payload['moderation_status'] = 'pending';
            }

            $listing->update($payload);
            $this->fields->syncMarketplaceListing($listing, $data['field_values'] ?? []);
            $this->images->replace($listing->images(), $data['images'] ?? []);
            $this->privateData->sync($listing, $data['private_data'] ?? null);

            return $listing->refresh();
        });
    }
}
