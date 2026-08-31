<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ServiceSubCategoryRequest;
use App\Http\Resources\ServiceSubCategoryResource;
use App\Models\ServiceSubCategory;
use Illuminate\Http\RedirectResponse;

class ServiceSubCategoryController extends Controller
{
    public function index()
    {
        return ServiceSubCategoryResource::collection(
            ServiceSubCategory::query()
                ->with(['category', 'fieldLinks.field.options', 'formConfig', 'pricingFields', 'mediaRule', 'bookingConfig', 'displayFields.field', 'filterFields.field'])
                ->orderBy('service_category_id')
                ->orderBy('sort_order')
                ->get(),
        );
    }

    public function store(ServiceSubCategoryRequest $request): RedirectResponse
    {
        ServiceSubCategory::query()->create(array_merge($request->validated(), [
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'service-sub-category-created');
    }

    public function show(ServiceSubCategory $serviceSubCategory): ServiceSubCategoryResource
    {
        return new ServiceSubCategoryResource(
            $serviceSubCategory->load(['category', 'fieldLinks.field.options', 'formConfig', 'pricingFields', 'mediaRule', 'bookingConfig', 'displayFields.field', 'filterFields.field']),
        );
    }

    public function update(ServiceSubCategoryRequest $request, ServiceSubCategory $serviceSubCategory): RedirectResponse
    {
        $serviceSubCategory->update(array_merge($request->validated(), [
            'updated_by' => $request->user()->id,
        ]));

        return back()->with('status', 'service-sub-category-updated');
    }

    public function destroy(ServiceSubCategory $serviceSubCategory): RedirectResponse
    {
        $serviceSubCategory->delete();

        return back()->with('status', 'service-sub-category-deleted');
    }
}
