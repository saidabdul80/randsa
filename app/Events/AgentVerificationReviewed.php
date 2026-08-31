<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\AgentVerification;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AgentVerificationReviewed implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public AgentVerification $verification,
        public ?string $previousStatus = null,
    ) {}

    public function notificationName(): string
    {
        return 'agent-verification.reviewed';
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
            'previous_status' => $this->previousStatus,
            'status' => $this->verification->status,
        ];
    }
}
