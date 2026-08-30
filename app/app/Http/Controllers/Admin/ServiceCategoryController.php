<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ServiceCategoryRequest;
use App\Http\Resources\ServiceCategoryResource;
use App\Models\ServiceCategory;
use Illuminate\Http\RedirectResponse;

class ServiceCategoryController extends Controller
{
    public function index()
    {
        return ServiceCategoryResource::collection(
            ServiceCategory::query()->with('subCategories')->orderBy('sort_order')->get(),
        );
    }

    public function store(ServiceCategoryRequest $request): RedirectResponse
    {
        ServiceCategory::query()->create(array_merge($request->validated(), [
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'service-category-created');
    }

    public function show(ServiceCategory $serviceCategory): ServiceCategoryResource
    {
        return new ServiceCategoryResource($serviceCategory->load('subCategories'));
    }

    public function update(ServiceCategoryRequest $request, ServiceCategory $serviceCategory): RedirectResponse
    {
        $serviceCategory->update(array_merge($request->validated(), [
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'service-category-updated');
    }

    public function destroy(ServiceCategory $serviceCategory): RedirectResponse
    {
        $serviceCategory->delete();

        return back()->with('status', 'service-category-deleted');
    }
}
