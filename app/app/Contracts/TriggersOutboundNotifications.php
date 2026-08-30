<?php

namespace App\Contracts;

interface TriggersOutboundNotifications
{
    public function notificationName(): string;

    /**
     * @return array<int, mixed>
     */
    public function notificationRecipients(): array;

    /**
     * @return array<string, mixed>
     */
    public function notificationContext(): array;
}
