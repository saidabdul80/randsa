<?php

namespace App\Listeners;

use App\Contracts\TriggersOutboundNotifications;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendDomainEventEmail implements ShouldQueue
{
    public function handle(TriggersOutboundNotifications $event): void
    {
        // Add Mail/Notification dispatch here when email templates are ready.
    }
}
