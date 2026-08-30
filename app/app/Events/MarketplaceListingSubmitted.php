<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\MarketplaceListing;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MarketplaceListingSubmitted implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(public MarketplaceListing $listing) {}

    public function notificationName(): string
    {
        return 'marketplace-listing.submitted';
    }

    public function notificationRecipients(): array
    {
        return array_values(array_filter([$this->listing->owner()->first()]));
    }

    public function notificationContext(): array
    {
        return [
            'marketplace_listing_id' => $this->listing->id,
            'owner_id' => $this->listing->owner_id,
            'service_category_id' => $this->listing->service_category_id,
            'service_sub_category_id' => $this->listing->service_sub_category_id,
            'status' => $this->listing->status,
            'moderation_status' => $this->listing->moderation_status,
        ];
    }
}
