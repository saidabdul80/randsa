<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Booking $booking): bool
    {
        return $booking->user_id === $user->id || $user->can('bookings.manage-all');
    }

    public function create(User $user): bool
    {
        return $user->can('bookings.create');
    }

    public function update(User $user, Booking $booking): bool
    {
        return $booking->user_id === $user->id || $user->can('bookings.manage-all');
    }

    public function cancel(User $user, Booking $booking): bool
    {
        return $this->update($user, $booking);
    }
}
