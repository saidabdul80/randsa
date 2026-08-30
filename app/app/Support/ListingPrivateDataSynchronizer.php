<?php

namespace App\Support;

use App\Models\MarketplaceListing;

class ListingPrivateDataSynchronizer
{
    /**
     * @param  array<string, mixed>|null  $privateData
     */
    public function sync(MarketplaceListing $listing, ?array $privateData): void
    {
        if (! $privateData || empty($privateData['document_url'])) {
            return;
        }

        $listing->privateData()->updateOrCreate(
            ['listing_id' => $listing->id],
            array_merge($privateData, ['owner_id' => $listing->owner_id]),
        );
    }
}
