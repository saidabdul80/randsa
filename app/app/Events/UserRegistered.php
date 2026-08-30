<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\User;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserRegistered implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(public User $user) {}

    public function notificationName(): string
    {
        return 'user.registered';
    }

    public function notificationRecipients(): array
    {
        return [$this->user];
    }

    public function notificationContext(): array
    {
        return [
            'user_id' => $this->user->id,
        ];
    }
}
