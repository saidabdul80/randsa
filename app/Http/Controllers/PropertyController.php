<?php

namespace App\Http\Controllers;

use App\Actions\Properties\StorePropertyAction;
use App\Actions\Properties\UpdatePropertyAction;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Support\ListingImageUploadPayload;
use Illuminate\Http\RedirectResponse;

class PropertyController extends Controller
{
    public function store(StorePropertyRequest $request, StorePropertyAction $storeProperty, ListingImageUploadPayload $uploads): RedirectResponse
    {
        $this->authorize('create', Property::class);
        $storeProperty->execute($request->user(), $uploads->merge($request, $request->validated(), 'properties'));

        return redirect()->route('post-listing')->with('status', 'property-created');
    }

    public function update(UpdatePropertyRequest $request, Property $property, UpdatePropertyAction $updateProperty, ListingImageUploadPayload $uploads): RedirectResponse
    {
        $this->authorize('update', $property);
        $updateProperty->execute($property, $request->user(), $uploads->merge($request, $request->validated(), 'properties'));

        return back()->with('status', 'property-updated');
    }

    public function destroy(Property $property): RedirectResponse
    {
        $this->authorize('delete', $property);
        $property->delete();

        return redirect()->route('my-listings')->with('status', 'property-deleted');
    }

    public function show(Property $property): PropertyResource
    {
        $this->authorize('view', $property);

        $relations = ['category', 'subCategory', 'fieldValues.field', 'images'];
        if (request()->user()?->can('properties.moderate')) {
            $relations[] = 'owner';
        }

        return new PropertyResource($property->load($relations));
    }
}
