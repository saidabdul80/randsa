<?php

namespace App\Policies;

use App\Models\MarketplaceListing;
use App\Models\User;

class MarketplaceListingPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, MarketplaceListing $marketplaceListing): bool
    {
        return ($marketplaceListing->status === 'active' && $marketplaceListing->moderation_status === 'approved')
            || $marketplaceListing->owner_id === $user->id
            || $user->can('marketplace-listings.moderate');
    }

    public function create(User $user): bool
    {
        return $user->can('marketplace-listings.create');
    }

    public function update(User $user, MarketplaceListing $marketplaceListing): bool
    {
        return $marketplaceListing->owner_id === $user->id || $user->can('marketplace-listings.moderate');
    }

    public function delete(User $user, MarketplaceListing $marketplaceListing): bool
    {
        return $marketplaceListing->owner_id === $user->id || $user->can('marketplace-listings.moderate');
    }

    public function review(User $user, MarketplaceListing $marketplaceListing): bool
    {
        return $user->can('marketplace-listings.moderate');
    }
}
