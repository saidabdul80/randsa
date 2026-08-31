<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Property $property): bool
    {
        return $property->status === 'approved'
            || $property->owner_id === $user->id
            || $user->can('properties.moderate');
    }

    public function create(User $user): bool
    {
        return $user->can('properties.create');
    }

    public function update(User $user, Property $property): bool
    {
        return $property->owner_id === $user->id || $user->can('properties.moderate');
    }

    public function delete(User $user, Property $property): bool
    {
        return $property->owner_id === $user->id || $user->can('properties.moderate');
    }

    public function review(User $user, Property $property): bool
    {
        return $user->can('properties.moderate');
    }
}
