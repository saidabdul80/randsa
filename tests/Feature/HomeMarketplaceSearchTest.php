<?php

namespace Tests\Feature;

use App\Models\LandingPageSection;
use App\Models\ListingPriceRange;
use App\Models\MarketplaceListing;
use App\Models\Property;
use App\Models\ServiceCategory;
use App\Models\ServiceSubCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeMarketplaceSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_marketplace_results_are_filtered_and_cursor_paginated_by_the_backend(): void
    {
        [$category, $rent, $service] = $this->seedHomeSearchConfig();
        $owner = $this->seedHomeSearchOwner();

        foreach (range(1, 8) as $index) {
            Property::query()->create([
                'owner_id' => $owner->id,
                'service_category_id' => $category->id,
                'service_sub_category_id' => $rent->id,
                'title' => "Lekki apartment {$index}",
                'description' => 'Serviced apartment in Lekki',
                'state' => 'Lagos',
                'city' => 'Lagos',
                'area' => 'Lekki',
                'status' => 'approved',
                'is_available' => true,
                'base_price' => 180000,
                'currency' => 'NGN',
                'created_at' => now()->subMinutes($index),
                'updated_at' => now()->subMinutes($index),
            ]);
        }

        MarketplaceListing::query()->create([
            'owner_id' => $owner->id,
            'service_category_id' => $category->id,
            'service_sub_category_id' => $service->id,
            'title' => 'Abuja plumbing repair',
            'description' => 'Emergency plumbing service',
            'status' => 'active',
            'moderation_status' => 'approved',
            'country' => 'Nigeria',
            'state' => 'FCT',
            'city' => 'Abuja',
            'base_price' => 45000,
            'contact_name' => 'Demo Provider',
            'contact_phone' => '+2348012345678',
            'published_at' => now(),
        ]);

        $this->get('/?city=Lagos&price=under_250k&per_page=6')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('HomePage')
                ->where('resultMeta.count', 6)
                ->where('resultMeta.has_more', true)
                ->has('resultMeta.next_cursor')
                ->has('marketplaceResults', 6)
                ->where('searchFilters.city', 'Lagos')
                ->where('searchFilters.price', 'under_250k')
            );
    }

    public function test_home_marketplace_json_endpoint_loads_the_next_cursor_page_without_exposing_owners(): void
    {
        [$category, $rent, $service] = $this->seedHomeSearchConfig();
        $owner = $this->seedHomeSearchOwner();

        foreach (range(1, 8) as $index) {
            Property::query()->create([
                'owner_id' => $owner->id,
                'service_category_id' => $category->id,
                'service_sub_category_id' => $rent->id,
                'title' => "Lekki apartment {$index}",
                'description' => 'Serviced apartment in Lekki',
                'state' => 'Lagos',
                'city' => 'Lagos',
                'area' => 'Lekki',
                'status' => 'approved',
                'is_available' => true,
                'base_price' => 180000,
                'currency' => 'NGN',
                'created_at' => now()->subMinutes($index),
                'updated_at' => now()->subMinutes($index),
            ]);
        }

        MarketplaceListing::query()->create([
            'owner_id' => $owner->id,
            'service_category_id' => $category->id,
            'service_sub_category_id' => $service->id,
            'title' => 'Abuja plumbing repair',
            'description' => 'Emergency plumbing service',
            'status' => 'active',
            'moderation_status' => 'approved',
            'country' => 'Nigeria',
            'state' => 'FCT',
            'city' => 'Abuja',
            'base_price' => 45000,
            'contact_name' => 'Demo Provider',
            'contact_phone' => '+2348012345678',
            'published_at' => now(),
        ]);

        $firstPage = $this->getJson('/marketplace-results?city=Lagos&price=under_250k&per_page=6')
            ->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('meta.has_more', true)
            ->assertJsonMissingPath('data.0.item.owner')
            ->assertJsonMissingPath('data.0.item.owner_id')
            ->assertJsonMissingPath('data.0.item.address')
            ->assertJsonMissingPath('data.0.item.latitude')
            ->assertJsonMissingPath('data.0.item.longitude')
            ->json();

        $secondPage = $this->getJson('/marketplace-results?city=Lagos&price=under_250k&per_page=6&cursor='.urlencode($firstPage['meta']['next_cursor']))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.has_more', false)
            ->json();

        $firstPageKeys = collect($firstPage['data'])->map(fn (array $entry): string => $entry['source'].':'.$entry['item']['id']);
        $secondPageKeys = collect($secondPage['data'])->map(fn (array $entry): string => $entry['source'].':'.$entry['item']['id']);

        $this->assertEmpty($firstPageKeys->intersect($secondPageKeys)->all());
    }

    public function test_public_property_details_hide_owner_and_precise_location_data(): void
    {
        [$category, $rent] = $this->seedHomeSearchConfig();
        $owner = $this->seedHomeSearchOwner();

        $property = Property::query()->create([
            'owner_id' => $owner->id,
            'service_category_id' => $category->id,
            'service_sub_category_id' => $rent->id,
            'title' => 'Private apartment in Lekki',
            'description' => 'Serviced apartment in Lekki',
            'state' => 'Lagos',
            'city' => 'Lagos',
            'area' => 'Lekki',
            'address' => '12 Private Street',
            'latitude' => 6.4281,
            'longitude' => 3.4219,
            'owner_phone' => '+2348012345678',
            'status' => 'approved',
            'is_available' => true,
            'base_price' => 180000,
            'currency' => 'NGN',
        ]);

        $this->get("/properties/{$property->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('PropertyDetailsPage')
                ->where('property.data.title', 'Private apartment in Lekki')
                ->missing('property.data.owner')
                ->missing('property.data.owner_id')
                ->missing('property.data.owner_phone')
                ->missing('property.data.address')
                ->missing('property.data.latitude')
                ->missing('property.data.longitude')
            );
    }

    private function seedHomeSearchConfig(): array
    {
        $category = ServiceCategory::query()->create([
            'id' => 'housing',
            'name' => 'housing',
            'label' => 'Housing',
            'slug' => 'housing',
            'type' => 'housing',
            'sort_order' => 10,
            'is_active' => true,
            'is_public' => true,
        ]);

        $rent = ServiceSubCategory::query()->create([
            'id' => 'housing_apartment_rent',
            'service_category_id' => $category->id,
            'name' => 'housing_apartment_rent',
            'label' => 'Apartments for rent',
            'slug' => 'apartments-for-rent',
            'type' => 'housing_rent',
            'transaction_type' => 'rent',
            'provider_kind' => 'user',
            'default_listing_table' => 'properties',
            'sort_order' => 10,
            'is_active' => true,
            'is_public' => true,
        ]);

        $service = ServiceSubCategory::query()->create([
            'id' => 'artisan_plumbing',
            'service_category_id' => $category->id,
            'name' => 'artisan_plumbing',
            'label' => 'Plumbers',
            'slug' => 'plumbers',
            'type' => 'service_renderer',
            'transaction_type' => 'service',
            'provider_kind' => 'artisan',
            'default_listing_table' => 'marketplace_listings',
            'sort_order' => 20,
            'is_active' => true,
            'is_public' => true,
        ]);

        ListingPriceRange::query()->updateOrCreate(
            ['id' => 'under_250k'],
            [
                'label' => 'Under NGN 250,000',
                'currency' => 'NGN',
                'max_amount' => 249999.99,
                'sort_order' => 10,
                'is_active' => true,
                'is_public' => true,
            ],
        );

        LandingPageSection::query()->create([
            'section_key' => 'hero_slide',
            'placement' => 'home',
            'title' => 'Find services',
            'description' => 'Search customer services.',
            'sort_order' => 10,
            'is_active' => true,
        ]);

        return [$category, $rent, $service];
    }

    private function seedHomeSearchOwner(): User
    {
        return User::query()->create([
            'id' => (string) Str::uuid(),
            'first_name' => 'Demo',
            'last_name' => 'Owner',
            'email' => 'owner@example.test',
            'password' => Hash::make('password'),
            'account_status' => 'active',
        ]);
    }
}
