<?php

namespace App\Http\Controllers;

use App\Actions\MarketplaceListings\StoreMarketplaceListingAction;
use App\Actions\MarketplaceListings\UpdateMarketplaceListingAction;
use App\Http\Requests\StoreMarketplaceListingRequest;
use App\Http\Requests\UpdateMarketplaceListingRequest;
use App\Http\Resources\MarketplaceListingResource;
use App\Models\MarketplaceListing;
use App\Support\ListingImageUploadPayload;
use Illuminate\Http\RedirectResponse;

class MarketplaceListingController extends Controller
{
    public function store(StoreMarketplaceListingRequest $request, StoreMarketplaceListingAction $storeListing, ListingImageUploadPayload $uploads): RedirectResponse
    {
        $this->authorize('create', MarketplaceListing::class);
        $storeListing->execute($request->user(), $uploads->merge($request, $request->validated(), 'marketplace-listings'));

        return redirect()->route('post-listing')->with('status', 'listing-created');
    }

    public function update(UpdateMarketplaceListingRequest $request, MarketplaceListing $marketplaceListing, UpdateMarketplaceListingAction $updateListing, ListingImageUploadPayload $uploads): RedirectResponse
    {
        $this->authorize('update', $marketplaceListing);
        $updateListing->execute($marketplaceListing, $request->user(), $uploads->merge($request, $request->validated(), 'marketplace-listings'));

        return back()->with('status', 'listing-updated');
    }

    public function destroy(MarketplaceListing $marketplaceListing): RedirectResponse
    {
        $this->authorize('delete', $marketplaceListing);
        $marketplaceListing->delete();

        return redirect()->route('my-listings')->with('status', 'listing-deleted');
    }

    public function show(MarketplaceListing $marketplaceListing): MarketplaceListingResource
    {
        $this->authorize('view', $marketplaceListing);

        $relations = ['category', 'subCategory', 'fieldValues.field', 'images', 'privateData'];
        if (request()->user()?->can('marketplace-listings.moderate')) {
            $relations[] = 'owner';
        }

        return new MarketplaceListingResource($marketplaceListing->load($relations));
    }
}
