<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListingPriceRangeRequest;
use App\Http\Resources\ListingPriceRangeResource;
use App\Models\ListingPriceRange;
use Illuminate\Http\RedirectResponse;

class ListingPriceRangeController extends Controller
{
    public function index()
    {
        return ListingPriceRangeResource::collection(
            ListingPriceRange::query()->orderBy('sort_order')->get(),
        );
    }

    public function store(ListingPriceRangeRequest $request): RedirectResponse
    {
        ListingPriceRange::query()->create(array_merge($request->validated(), [
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'listing-price-range-created');
    }

    public function show(ListingPriceRange $listingPriceRange): ListingPriceRangeResource
    {
        return new ListingPriceRangeResource($listingPriceRange);
    }

    public function update(ListingPriceRangeRequest $request, ListingPriceRange $listingPriceRange): RedirectResponse
    {
        $listingPriceRange->update(array_merge($request->validated(), [
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'listing-price-range-updated');
    }

    public function destroy(ListingPriceRange $listingPriceRange): RedirectResponse
    {
        $listingPriceRange->delete();

        return back()->with('status', 'listing-price-range-deleted');
    }
}
