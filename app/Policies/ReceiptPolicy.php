<?php

namespace App\Policies;

use App\Models\Receipt;
use App\Models\User;

class ReceiptPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Receipt $receipt): bool
    {
        return $receipt->owner_id === $user->id
            || $receipt->user_id === $user->id
            || $user->can('payments.manage');
    }

    public function create(User $user): bool
    {
        return $user->can('properties.create')
            || $user->can('marketplace-listings.create')
            || $user->can('payments.manage');
    }
}
