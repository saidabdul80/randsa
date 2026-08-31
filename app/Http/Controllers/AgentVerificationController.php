<?php

namespace App\Http\Controllers;

use App\Events\AgentVerificationReviewed;
use App\Events\AgentVerificationSubmitted;
use App\Http\Requests\ReviewAgentVerificationRequest;
use App\Http\Requests\StoreAgentVerificationRequest;
use App\Http\Resources\AgentVerificationResource;
use App\Models\AgentVerification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AgentVerificationController extends Controller
{
    public function index(Request $request)
    {
        $query = AgentVerification::query()->latest('submitted_at');

        if (! $request->user()->can('agent-verifications.review')) {
            $query->where('agent_id', $request->user()->id);
        }

        return AgentVerificationResource::collection($query->with('agent')->get());
    }

    public function store(StoreAgentVerificationRequest $request): RedirectResponse
    {
        $this->authorize('create', AgentVerification::class);

        $verification = AgentVerification::query()->updateOrCreate(
            ['agent_id' => $request->user()->id, 'status' => 'pending'],
            array_merge($request->validated(), [
                'submitted_at' => now(),
                'reviewed_at' => null,
                'admin_note' => null,
            ]),
        );

        AgentVerificationSubmitted::dispatch($verification);

        return back()->with('status', 'verification-submitted');
    }

    public function review(ReviewAgentVerificationRequest $request, AgentVerification $agentVerification): RedirectResponse
    {
        $this->authorize('review', $agentVerification);

        $status = $request->string('status')->toString();
        $previousStatus = $agentVerification->status;

        $agentVerification->update(array_merge($request->validated(), [
            'reviewed_at' => now(),
        ]));

        $agentVerification->agent?->update([
            'is_verified' => $status === 'approved',
        ]);

        AgentVerificationReviewed::dispatch($agentVerification, $previousStatus);

        return back()->with('status', 'verification-reviewed');
    }
}
