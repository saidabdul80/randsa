<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\AgentVerification;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AgentVerificationSubmitted implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(public AgentVerification $verification) {}

    public function notificationName(): string
    {
        return 'agent-verification.submitted';
    }

    public function notificationRecipients(): array
    {
        return array_values(array_filter([$this->verification->agent()->first()]));
    }

    public function notificationContext(): array
    {
        return [
            'agent_verification_id' => $this->verification->id,
            'agent_id' => $this->verification->agent_id,
            'status' => $this->verification->status,
        ];
    }
}
