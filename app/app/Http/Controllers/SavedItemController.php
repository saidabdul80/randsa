<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSavedItemRequest;
use App\Http\Resources\SavedItemResource;
use App\Models\SavedItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SavedItemController extends Controller
{
    public function index(Request $request)
    {
        return SavedItemResource::collection(
            SavedItem::query()
                ->where('user_id', $request->user()->id)
                ->with(['property.images', 'marketplaceListing.images'])
                ->latest()
                ->get(),
        );
    }

    public function store(StoreSavedItemRequest $request): RedirectResponse
    {
        $this->authorize('create', SavedItem::class);

        $data = $request->validated();
        $query = SavedItem::query()
            ->where('user_id', $request->user()->id)
            ->where('item_type', $data['item_type']);

        if ($data['item_type'] === 'property') {
            $query->where('property_id', $data['property_id'])->whereNull('marketplace_listing_id');
        } else {
            $query->where('marketplace_listing_id', $data['marketplace_listing_id'])->whereNull('property_id');
        }

        $savedItem = $query->first();
        if ($savedItem) {
            $savedItem->delete();

            return back()->with('status', 'saved-item-removed');
        }

        SavedItem::query()->create(array_merge($data, ['user_id' => $request->user()->id]));

        return back()->with('status', 'item-saved');
    }

    public function destroy(SavedItem $savedItem): RedirectResponse
    {
        $this->authorize('delete', $savedItem);

        $savedItem->delete();

        return back()->with('status', 'saved-item-removed');
    }
}
