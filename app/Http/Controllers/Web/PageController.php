<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\HomeMarketplaceSearchRequest;
use App\Http\Resources\AgentVerificationResource;
use App\Http\Resources\BookingResource;
use App\Http\Resources\LandingPageSectionResource;
use App\Http\Resources\ListingPriceRangeResource;
use App\Http\Resources\MarketplaceListingResource;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\SavedItemResource;
use App\Http\Resources\ServiceCategoryResource;
use App\Http\Resources\ServiceFieldResource;
use App\Http\Resources\UserProfileResource;
use App\Models\AgentVerification;
use App\Models\Booking;
use App\Models\LandingPageSection;
use App\Models\ListingPriceRange;
use App\Models\MarketplaceListing;
use App\Models\Payment;
use App\Models\Property;
use App\Models\SavedItem;
use App\Models\ServiceCategory;
use App\Models\ServiceField;
use App\Models\ServiceSubCategory;
use App\Models\User;
use App\Queries\HomeMarketplaceSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Response;

class PageController extends Controller
{
    public function root(): RedirectResponse
    {
        return redirect()->route('onboarding');
    }

    public function onboarding(): Response
    {
        return inertia('OnboardingPage');
    }

    public function login(): Response
    {
        return inertia('LoginPage');
    }

    public function register(): Response
    {
        return inertia('RegisterPage');
    }

    public function home(HomeMarketplaceSearchRequest $request, HomeMarketplaceSearch $search): Response
    {
        $filters = $request->filters();
        $results = $search->execute($filters, $request->user());

        return inertia('HomePage', [
            'serviceCategories' => ServiceCategoryResource::collection(
                ServiceCategory::query()
                    ->with(['subCategories' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order')])
                    ->where('is_active', true)
                    ->where('is_public', true)
                    ->orderBy('sort_order')
                    ->get(),
            ),
            'marketplaceResults' => $this->marketplaceResultPayload($results['items'], $request),
            'searchFilters' => $filters,
            'resultMeta' => $results['meta'],
            'landingMetrics' => $this->landingMetrics(),
            'landingHeroSlides' => LandingPageSectionResource::collection($this->landingSections('hero_slide', $this->defaultHeroSlides())),
            'landingWorkflowItems' => LandingPageSectionResource::collection($this->landingSections('workflow_item', $this->defaultWorkflowItems())),
            'priceRanges' => ListingPriceRangeResource::collection($this->priceRanges()),
        ]);
    }

    public function marketplaceResults(HomeMarketplaceSearchRequest $request, HomeMarketplaceSearch $search): JsonResponse
    {
        $results = $search->execute($request->filters(), $request->user());

        return response()->json([
            'data' => $this->marketplaceResultPayload($results['items'], $request),
            'meta' => $results['meta'],
        ]);
    }

    public function properties(): RedirectResponse
    {
        return redirect(route('home').'#listings');
    }

    private function marketplaceResultPayload($items, Request $request)
    {
        return $items->map(fn (array $entry): array => [
            'source' => $entry['source'],
            'item' => $entry['source'] === 'property'
                ? (new PropertyResource($entry['item']))->resolve($request)
                : (new MarketplaceListingResource($entry['item']))->resolve($request),
        ]);
    }

    public function propertyDetails(Property $property): Response
    {
        $property->load(['category', 'subCategory.bookingConfig', 'subCategory.displayFields.field', 'fieldValues.field', 'images', 'availabilityAgents.agent']);
        if (request()->user()) {
            $property->loadExists([
                'savedItems as saved_by_current_user_exists' => fn ($query) => $query->where('user_id', request()->user()->id),
            ]);
        }

        return inertia('PropertyDetailsPage', [
            'property' => new PropertyResource($property),
            'similarProperties' => PropertyResource::collection($this->similarProperties($property)),
            'propertyTrustItems' => LandingPageSectionResource::collection($this->landingSections('property_trust_item', [], 'property_detail')),
        ]);
    }

    public function listingDetails(MarketplaceListing $marketplaceListing): Response
    {
        $marketplaceListing->load(['category', 'subCategory', 'fieldValues.field', 'images']);
        if (request()->user()) {
            $marketplaceListing->loadExists([
                'savedItems as saved_by_current_user_exists' => fn ($query) => $query->where('user_id', request()->user()->id),
            ]);
        }

        return inertia('MarketplaceListingDetailsPage', [
            'listing' => new MarketplaceListingResource($marketplaceListing),
            'similarListings' => MarketplaceListingResource::collection($this->similarMarketplaceListings($marketplaceListing)),
        ]);
    }

    public function postListing(): Response
    {
        if (! request()->user()->can('properties.create') && ! request()->user()->can('marketplace-listings.create')) {
            return inertia('AccessRequiredPage', [
                'title' => 'Posting access required',
                'message' => 'Your account does not currently have permission to publish listings.',
                'actionLabel' => 'Go to profile',
                'actionHref' => route('profile'),
            ]);
        }

        return inertia('AddPropertyPage', array_merge($this->listingFormProps(), $this->userListingProps(request())));
    }

    public function editListing(MarketplaceListing $marketplaceListing): Response
    {
        $this->authorize('update', $marketplaceListing);

        return inertia('AddPropertyPage', array_merge($this->listingFormProps(), $this->userListingProps(request()), [
            'listing' => new MarketplaceListingResource($marketplaceListing->load(['fieldValues.field', 'images', 'privateData'])),
        ]));
    }

    public function myListings(Request $request): Response
    {
        return inertia('MyListingsPage', array_merge($this->listingFormProps(), $this->userListingProps($request)));
    }

    public function editProperty(Property $property): Response
    {
        $this->authorize('update', $property);

        return inertia('EditPropertyPage', array_merge($this->listingFormProps(), $this->userListingProps(request()), [
            'property' => new PropertyResource($property->load(['fieldValues.field', 'images', 'availabilityAgents.vacations'])),
        ]));
    }

    public function savedProperties(Request $request): Response
    {
        return inertia('SavedPropertiesPage', [
            'savedItems' => SavedItemResource::collection(
                SavedItem::query()
                    ->where('user_id', $request->user()->id)
                    ->with(['property.images', 'marketplaceListing.images'])
                    ->latest()
                    ->paginate(12)
                    ->withQueryString(),
            ),
        ]);
    }

    public function booking(Request $request, ?Property $property = null): Response
    {
        $marketplaceListing = $request->integer('listing')
            ? MarketplaceListing::query()->with(['subCategory.bookingConfig', 'images'])->find($request->integer('listing'))
            : null;

        return inertia('BookingPage', [
            'property' => $property ? new PropertyResource($property->load(['subCategory.bookingConfig', 'images'])) : null,
            'listing' => $marketplaceListing ? new MarketplaceListingResource($marketplaceListing) : null,
            'bookings' => BookingResource::collection(
                Booking::query()
                    ->where('user_id', $request->user()->id)
                    ->with(['property', 'marketplaceListing'])
                    ->latest()
                    ->paginate(6, ['*'], 'bookings_page')
                    ->withQueryString(),
            ),
        ]);
    }

    public function myBookings(Request $request): Response
    {
        return inertia('MyBookingsPage', [
            'bookings' => BookingResource::collection(
                Booking::query()
                    ->where('user_id', $request->user()->id)
                    ->with(['property.images', 'marketplaceListing.images', 'payments'])
                    ->latest()
                    ->paginate(12)
                    ->withQueryString(),
            ),
        ]);
    }

    public function payment(Request $request, ?Property $property = null): Response
    {
        $marketplaceListing = $request->integer('listing')
            ? MarketplaceListing::query()->with(['subCategory.pricingFields', 'images'])->find($request->integer('listing'))
            : null;

        return inertia('PaymentPage', [
            'property' => $property ? new PropertyResource($property->load('subCategory.pricingFields')) : null,
            'listing' => $marketplaceListing ? new MarketplaceListingResource($marketplaceListing) : null,
            'payments' => PaymentResource::collection(
                Payment::query()
                    ->where('user_id', $request->user()->id)
                    ->with(['booking'])
                    ->latest()
                    ->paginate(10, ['*'], 'payments_page')
                    ->withQueryString(),
            ),
        ]);
    }

    public function agentVerification(Request $request): Response
    {
        $verification = AgentVerification::query()->where('agent_id', $request->user()->id)->latest('submitted_at')->first();

        return inertia('AgentVerificationPage', [
            'verification' => $verification ? new AgentVerificationResource($verification) : null,
        ]);
    }

    public function notifications(Request $request): Response
    {
        return inertia('NotificationsPage', [
            'notifications' => NotificationResource::collection(
                $request->user()
                    ->notifications()
                    ->latest()
                    ->paginate(15)
                    ->withQueryString(),
            ),
        ]);
    }

    public function admin(Request $request): Response
    {
        return inertia('AdminDashboardPage', [
            'profile' => new UserProfileResource($request->user()->load(['roles', 'permissions'])),
            'counts' => [
                'pending_properties' => Property::query()->where('status', 'pending')->count(),
                'pending_listings' => MarketplaceListing::query()->where('moderation_status', 'pending')->count(),
                'pending_verifications' => AgentVerification::query()->where('status', 'pending')->count(),
                'users' => User::query()->count(),
            ],
        ]);
    }

    private function listingFormProps(): array
    {
        return [
            'serviceCategories' => ServiceCategoryResource::collection(
                ServiceCategory::query()
                    ->with([
                        'subCategories' => fn ($query) => $query
                            ->with(['fieldLinks.field.options', 'formConfig', 'pricingFields', 'mediaRule', 'bookingConfig', 'displayFields.field', 'filterFields.field'])
                            ->where('is_active', true)
                            ->orderBy('sort_order'),
                    ])
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get(),
            ),
            'serviceFields' => ServiceFieldResource::collection(
                ServiceField::query()->with('options')->where('is_active', true)->orderBy('label')->get(),
            ),
        ];
    }

    private function userListingProps(Request $request): array
    {
        return [
            'properties' => PropertyResource::collection(
                Property::query()
                    ->where('owner_id', $request->user()->id)
                    ->with(['category', 'subCategory', 'fieldValues.field', 'images', 'availabilityAgents.vacations'])
                    ->latest()
                    ->paginate(12, ['*'], 'properties_page')
                    ->withQueryString(),
            ),
            'marketplaceListings' => MarketplaceListingResource::collection(
                MarketplaceListing::query()
                    ->where('owner_id', $request->user()->id)
                    ->with(['category', 'subCategory', 'fieldValues.field', 'images', 'privateData'])
                    ->latest()
                    ->paginate(12, ['*'], 'listings_page')
                    ->withQueryString(),
            ),
        ];
    }

    private function similarProperties(Property $property)
    {
        $baseQuery = fn () => Property::query()
            ->with(['category', 'subCategory.displayFields.field', 'fieldValues.field', 'images'])
            ->when(request()->user(), fn ($query, User $user) => $query->withExists([
                'savedItems as saved_by_current_user_exists' => fn ($savedQuery) => $savedQuery->where('user_id', $user->id),
            ]))
            ->whereKeyNot($property->id)
            ->where('status', 'approved')
            ->where('is_available', true)
            ->latest();

        $similar = $baseQuery()
            ->where('service_sub_category_id', $property->service_sub_category_id)
            ->limit(8)
            ->get();

        if ($similar->count() < 8) {
            $similar = $similar->concat(
                $baseQuery()
                    ->where('service_category_id', $property->service_category_id)
                    ->whereNotIn('id', $similar->pluck('id')->push($property->id))
                    ->limit(8 - $similar->count())
                    ->get(),
            );
        }

        return $similar->values();
    }

    private function similarMarketplaceListings(MarketplaceListing $marketplaceListing)
    {
        $baseQuery = fn () => MarketplaceListing::query()
            ->with(['category', 'subCategory', 'images'])
            ->when(request()->user(), fn ($query, User $user) => $query->withExists([
                'savedItems as saved_by_current_user_exists' => fn ($savedQuery) => $savedQuery->where('user_id', $user->id),
            ]))
            ->whereKeyNot($marketplaceListing->id)
            ->where('status', 'active')
            ->where('moderation_status', 'approved')
            ->latest();

        $similar = $baseQuery()
            ->where('service_sub_category_id', $marketplaceListing->service_sub_category_id)
            ->limit(8)
            ->get();

        if ($similar->count() < 8) {
            $similar = $similar->concat(
                $baseQuery()
                    ->where('service_category_id', $marketplaceListing->service_category_id)
                    ->whereNotIn('id', $similar->pluck('id')->push($marketplaceListing->id))
                    ->limit(8 - $similar->count())
                    ->get(),
            );
        }

        return $similar->values();
    }

    private function landingMetrics(): array
    {
        return Cache::remember('landing.metrics', now()->addMinutes(5), fn (): array => [
            [
                'label' => 'Total listings',
                'value' => (string) (
                    Property::query()->where('status', 'approved')->where('is_available', true)->count()
                    + MarketplaceListing::query()->where('status', 'active')->where('moderation_status', 'approved')->count()
                ),
            ],
            [
                'label' => 'Active services',
                'value' => (string) ServiceSubCategory::query()->where('is_active', true)->where('is_public', true)->count(),
            ],
            [
                'label' => 'Service categories',
                'value' => (string) ServiceCategory::query()->where('is_active', true)->where('is_public', true)->count(),
            ],
        ]);
    }

    private function priceRanges()
    {
        $ranges = ListingPriceRange::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order')
            ->get();

        if ($ranges->isNotEmpty()) {
            return $ranges;
        }

        return collect([
            new ListingPriceRange(['id' => 'under_250k', 'label' => 'Under NGN 250,000', 'currency' => 'NGN', 'min_amount' => null, 'max_amount' => 249999.99, 'sort_order' => 10, 'is_active' => true, 'is_public' => true]),
            new ListingPriceRange(['id' => '250k_to_1m', 'label' => 'NGN 250,000 - 1M', 'currency' => 'NGN', 'min_amount' => 250000, 'max_amount' => 999999.99, 'sort_order' => 20, 'is_active' => true, 'is_public' => true]),
            new ListingPriceRange(['id' => 'above_1m', 'label' => 'NGN 1M and above', 'currency' => 'NGN', 'min_amount' => 1000000, 'max_amount' => null, 'sort_order' => 30, 'is_active' => true, 'is_public' => true]),
        ]);
    }

    private function landingSections(string $sectionKey, array $fallback, string $placement = 'home')
    {
        $sections = LandingPageSection::query()
            ->where('placement', $placement)
            ->where('section_key', $sectionKey)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        if ($sections->isNotEmpty()) {
            return $sections;
        }

        return collect($fallback)->map(fn (array $item) => new LandingPageSection($item));
    }

    private function defaultHeroSlides(): array
    {
        return [
            [
                'section_key' => 'hero_slide',
                'placement' => 'home',
                'eyebrow' => 'Housing',
                'title' => 'Find homes, shops, land, and inspections.',
                'description' => 'Search rent and sale listings, review property details, save options, and book inspections from one public marketplace.',
                'image_url' => '/images/seeded/home.webp',
                'sort_order' => 10,
                'is_active' => true,
            ],
            [
                'section_key' => 'hero_slide',
                'placement' => 'home',
                'eyebrow' => 'Rentals',
                'title' => 'Rent what you need, when you need it.',
                'description' => 'Discover vehicles, equipment, spaces, and short-term rentals organized by clear service categories.',
                'image_url' => '/images/seeded/car.webp',
                'sort_order' => 20,
                'is_active' => true,
            ],
            [
                'section_key' => 'hero_slide',
                'placement' => 'home',
                'eyebrow' => 'Events and services',
                'title' => 'Book spaces and trusted service renderers.',
                'description' => 'Find artisans, event vendors, professional services, and booking-enabled offers without hardcoded listing rules.',
                'image_url' => '/images/seeded/event.webp',
                'sort_order' => 30,
                'is_active' => true,
            ],
            [
                'section_key' => 'hero_slide',
                'placement' => 'home',
                'eyebrow' => 'Marketplace',
                'title' => 'Every category, one place.',
                'description' => 'Browse housing, marketplace items, leisure, jobs, and services through one searchable landing page.',
                'image_url' => '/images/seeded/leisure.webp',
                'sort_order' => 40,
                'is_active' => true,
            ],
        ];
    }

    private function defaultWorkflowItems(): array
    {
        return [
            [
                'section_key' => 'workflow_item',
                'placement' => 'home',
                'title' => 'Search across listing kinds',
                'description' => 'Housing rent, property sales, marketplace rentals, and artisan services share one searchable public surface.',
                'sort_order' => 10,
                'is_active' => true,
            ],
            [
                'section_key' => 'workflow_item',
                'placement' => 'home',
                'title' => 'Review configured details',
                'description' => 'Every field shown on a listing comes from admin-managed category settings instead of hardcoded frontend rules.',
                'sort_order' => 20,
                'is_active' => true,
            ],
            [
                'section_key' => 'workflow_item',
                'placement' => 'home',
                'title' => 'Book or contact cleanly',
                'description' => 'Book inspections and service appointments where enabled, or contact the provider through the listing workflow.',
                'sort_order' => 30,
                'is_active' => true,
            ],
        ];
    }
}
