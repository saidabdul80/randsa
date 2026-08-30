<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Payment $payment): bool
    {
        return $payment->user_id === $user->id || $user->can('payments.view-all');
    }

    public function create(User $user): bool
    {
        return $user->can('payments.create');
    }

    public function update(User $user, Payment $payment): bool
    {
        return $user->can('payments.manage');
    }

    public function markSuccessful(User $user, Payment $payment): bool
    {
        return $this->update($user, $payment);
    }
}
