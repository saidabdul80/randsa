<?php

namespace App\Listeners;

use App\Contracts\TriggersOutboundNotifications;
use Illuminate\Contracts\Queue\ShouldQueue;

class SendDomainEventSms implements ShouldQueue
{
    public function handle(TriggersOutboundNotifications $event): void
    {
        // Add SMS gateway dispatch here when the provider is selected.
    }
}
