<?php

namespace App\Policies;

use App\Models\AgentVerification;
use App\Models\User;

class AgentVerificationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, AgentVerification $agentVerification): bool
    {
        return $agentVerification->agent_id === $user->id || $user->can('agent-verifications.review');
    }

    public function create(User $user): bool
    {
        return $user->can('agent-verifications.submit');
    }

    public function update(User $user, AgentVerification $agentVerification): bool
    {
        return $agentVerification->agent_id === $user->id && $agentVerification->status === 'pending';
    }

    public function review(User $user, AgentVerification $agentVerification): bool
    {
        return $user->can('agent-verifications.review');
    }
}
