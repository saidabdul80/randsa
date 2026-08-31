<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ListingTransactionType;
use App\Enums\ProviderKind;
use App\Enums\ServiceCategoryType;
use App\Enums\ServiceSubCategoryType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AgentVerificationResource;
use App\Http\Resources\LandingPageSectionResource;
use App\Http\Resources\ListingPriceRangeResource;
use App\Http\Resources\MarketplaceListingResource;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\ServiceCategoryResource;
use App\Http\Resources\ServiceFieldResource;
use App\Models\AgentVerification;
use App\Models\LandingPageSection;
use App\Models\ListingPriceRange;
use App\Models\MarketplaceListing;
use App\Models\Permission;
use App\Models\Property;
use App\Models\Role;
use App\Models\ServiceCategory;
use App\Models\ServiceField;
use App\Models\ServiceSubCategory;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function overview(Request $request): Response
    {
        abort_unless($request->user()->can('admin.access'), 403);

        return inertia('AdminDashboardPage', [
            'counts' => $this->counts(),
        ]);
    }

    public function services(Request $request): Response
    {
        abort_unless($request->user()->can('service-categories.manage'), 403);

        return inertia('AdminServiceStructurePage', [
            'serviceCategories' => $this->serviceCategories(),
            'serviceFields' => ServiceFieldResource::collection(
                ServiceField::query()->with('options')->orderBy('label')->get(),
            ),
            'enumOptions' => $this->enumOptions(),
        ]);
    }

    public function site(Request $request): Response
    {
        abort_unless($request->user()->can('admin.access'), 403);

        return inertia('AdminSiteConfigurationPage', [
            'priceRanges' => ListingPriceRangeResource::collection(
                ListingPriceRange::query()->orderBy('sort_order')->get(),
            ),
            'landingPageSections' => LandingPageSectionResource::collection(
                LandingPageSection::query()->orderBy('placement')->orderBy('section_key')->orderBy('sort_order')->get(),
            ),
        ]);
    }

    public function permissions(Request $request): Response
    {
        abort_unless($request->user()->can('roles.manage'), 403);

        return inertia('AdminPermissionsPage', [
            'roles' => $this->roles(),
            'permissions' => $this->permissionGroups(),
        ]);
    }

    public function queues(Request $request): Response
    {
        abort_unless($request->user()->can('admin.access'), 403);

        return inertia('AdminModerationPage', [
            'pendingProperties' => PropertyResource::collection(
                Property::query()
                    ->with(['owner', 'images', 'subCategory'])
                    ->where('status', 'pending')
                    ->latest()
                    ->paginate(10, ['*'], 'pending_properties_page')
                    ->withQueryString(),
            ),
            'pendingListings' => MarketplaceListingResource::collection(
                MarketplaceListing::query()
                    ->with(['owner', 'images', 'subCategory'])
                    ->where('moderation_status', 'pending')
                    ->latest()
                    ->paginate(10, ['*'], 'pending_listings_page')
                    ->withQueryString(),
            ),
            'pendingVerifications' => AgentVerificationResource::collection(
                AgentVerification::query()
                    ->with('agent')
                    ->where('status', 'pending')
                    ->latest('submitted_at')
                    ->paginate(10, ['*'], 'pending_verifications_page')
                    ->withQueryString(),
            ),
        ]);
    }

    private function counts(): array
    {
        return [
            'users' => User::query()->count(),
            'pending_properties' => Property::query()->where('status', 'pending')->count(),
            'pending_listings' => MarketplaceListing::query()->where('moderation_status', 'pending')->count(),
            'pending_verifications' => AgentVerification::query()->where('status', 'pending')->count(),
            'service_categories' => ServiceCategory::query()->count(),
            'active_services' => ServiceSubCategory::query()->where('is_active', true)->count(),
            'published_listings' => Property::query()->where('status', 'approved')->count()
                + MarketplaceListing::query()->where('status', 'active')->where('moderation_status', 'approved')->count(),
        ];
    }

    private function serviceCategories()
    {
        return ServiceCategoryResource::collection(
            ServiceCategory::query()->with('subCategories')->orderBy('sort_order')->get(),
        );
    }

    private function roles()
    {
        return Role::query()
            ->with('permissions')
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'permissions' => $role->permissions->pluck('name')->values(),
            ]);
    }

    private function permissionGroups(): array
    {
        return Permission::query()
            ->orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group')
            ->map(fn ($permissions) => $permissions->map(fn (Permission $permission): array => [
                'id' => $permission->id,
                'name' => $permission->name,
                'description' => $permission->description,
                'group' => $permission->group,
            ])->values())
            ->toArray();
    }

    private function enumOptions(): array
    {
        return [
            'service_category_types' => ServiceCategoryType::values(),
            'service_sub_category_types' => ServiceSubCategoryType::values(),
            'transaction_types' => ListingTransactionType::values(),
            'provider_kinds' => ProviderKind::values(),
            'listing_tables' => ['properties', 'marketplace_listings'],
        ];
    }
}
