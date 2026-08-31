<?php

namespace App\Http\Controllers\Admin;

use App\Events\AgentVerificationReviewed;
use App\Events\MarketplaceListingReviewed;
use App\Events\PropertyReviewed;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewListingRequest;
use App\Http\Requests\ReviewAgentVerificationRequest;
use App\Models\AgentVerification;
use App\Models\MarketplaceListing;
use App\Models\Property;
use Illuminate\Http\RedirectResponse;

class ModerationController extends Controller
{
    public function reviewProperty(ReviewListingRequest $request, Property $property): RedirectResponse
    {
        $this->authorize('review', $property);

        $previousStatus = $property->status;

        $property->update([
            'status' => $request->string('status'),
        ]);

        PropertyReviewed::dispatch($property, $previousStatus);

        return back()->with('status', 'property-reviewed');
    }

    public function reviewMarketplaceListing(ReviewListingRequest $request, MarketplaceListing $marketplaceListing): RedirectResponse
    {
        $this->authorize('review', $marketplaceListing);

        $status = $request->string('status')->toString();
        $moderationStatus = $request->input('moderation_status', $status === 'active' ? 'approved' : 'pending');
        $previousStatus = $marketplaceListing->status;
        $previousModerationStatus = $marketplaceListing->moderation_status;

        $marketplaceListing->update([
            'status' => $status,
            'moderation_status' => $moderationStatus,
            'published_at' => $status === 'active' && $moderationStatus === 'approved' ? now() : $marketplaceListing->published_at,
        ]);

        MarketplaceListingReviewed::dispatch($marketplaceListing, $previousStatus, $previousModerationStatus);

        return back()->with('status', 'marketplace-listing-reviewed');
    }

    public function reviewAgentVerification(ReviewAgentVerificationRequest $request, AgentVerification $agentVerification): RedirectResponse
    {
        $this->authorize('review', $agentVerification);

        $status = $request->string('status')->toString();
        $previousStatus = $agentVerification->status;

        $agentVerification->update([
            'status' => $status,
            'admin_note' => $request->input('admin_note'),
            'reviewed_at' => now(),
        ]);

        $agentVerification->agent?->update([
            'is_verified' => $status === 'approved',
        ]);

        AgentVerificationReviewed::dispatch($agentVerification, $previousStatus);

        return back()->with('status', 'agent-verification-reviewed');
    }
}
