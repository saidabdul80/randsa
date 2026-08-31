<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\MarketplaceListing;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MarketplaceListingReviewed implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public MarketplaceListing $listing,
        public ?string $previousStatus = null,
        public ?string $previousModerationStatus = null,
    ) {}

    public function notificationName(): string
    {
        return 'marketplace-listing.reviewed';
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
            'previous_status' => $this->previousStatus,
            'status' => $this->listing->status,
            'previous_moderation_status' => $this->previousModerationStatus,
            'moderation_status' => $this->listing->moderation_status,
        ];
    }
}
