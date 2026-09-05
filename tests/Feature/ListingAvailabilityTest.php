<?php

namespace Tests\Feature;

use App\Models\MarketplaceListing;
use App\Models\Property;
use App\Models\ServiceCategory;
use App\Models\ServiceSubCategory;
use App\Models\User;
use Database\Seeders\PermissionAndRoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListingAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_provider_can_set_property_availability_slots(): void
    {
        $this->seed(PermissionAndRoleSeeder::class);

        [$category, $subCategory] = $this->seedAvailabilityCategory('properties');
        $user = User::factory()->create();
        $user->assignRole('provider');

        $slots = [
            ['date' => '2026-09-08', 'time' => '10:00'],
            ['date' => '2026-09-08', 'time' => '14:30'],
        ];
        $rules = [
            ['weekdays' => [1, 6], 'times' => ['09:00', '11:00']],
        ];

        $this->actingAs($user)
            ->post('/properties', [
                'service_category_id' => $category->id,
                'service_sub_category_id' => $subCategory->id,
                'title' => 'Inspection-ready apartment',
                'description' => 'A listing with provider availability.',
                'state' => 'Lagos',
                'city' => 'Lagos',
                'base_price' => 90000,
                'currency' => 'NGN',
                'availability_slots' => $slots,
                'availability_rules' => $rules,
            ])
            ->assertRedirect(route('post-listing'));

        $property = Property::query()->where('title', 'Inspection-ready apartment')->firstOrFail();

        $this->assertSame($slots, $property->availability_slots);
        $this->assertSame($rules, $property->availability_rules);
    }

    public function test_provider_can_set_marketplace_listing_availability_slots(): void
    {
        $this->seed(PermissionAndRoleSeeder::class);

        [$category, $subCategory] = $this->seedAvailabilityCategory('marketplace_listings');
        $user = User::factory()->create();
        $user->assignRole('provider');

        $slots = [
            ['date' => '2026-09-09', 'time' => '09:00'],
            ['date' => '2026-09-10', 'time' => '13:00'],
        ];
        $rules = [
            ['weekdays' => [3], 'times' => ['10:00', '15:30']],
        ];

        $this->actingAs($user)
            ->post('/listings', [
                'service_category_id' => $category->id,
                'service_sub_category_id' => $subCategory->id,
                'title' => 'Water heater installation',
                'description' => 'Professional installation service.',
                'state' => 'Lagos',
                'city' => 'Surulere',
                'base_price' => 25000,
                'currency' => 'NGN',
                'contact_name' => 'Service Desk',
                'contact_phone' => '+2348012345678',
                'availability_slots' => $slots,
                'availability_rules' => $rules,
            ])
            ->assertRedirect(route('post-listing'));

        $listing = MarketplaceListing::query()->where('title', 'Water heater installation')->firstOrFail();

        $this->assertSame($slots, $listing->availability_slots);
        $this->assertSame($rules, $listing->availability_rules);
    }

    private function seedAvailabilityCategory(string $defaultListingTable): array
    {
        $category = ServiceCategory::query()->create([
            'id' => 'availability_'.$defaultListingTable,
            'name' => 'availability_'.$defaultListingTable,
            'label' => 'Services',
            'slug' => 'availability-'.$defaultListingTable,
            'type' => 'services',
            'sort_order' => 10,
            'is_active' => true,
            'is_public' => true,
        ]);

        $subCategory = ServiceSubCategory::query()->create([
            'id' => 'availability_'.$defaultListingTable.'_subcategory',
            'service_category_id' => $category->id,
            'name' => 'availability_'.$defaultListingTable.'_subcategory',
            'label' => 'Bookable service',
            'slug' => 'availability-'.$defaultListingTable.'-subcategory',
            'type' => 'service',
            'transaction_type' => 'service',
            'provider_kind' => 'provider',
            'default_listing_table' => $defaultListingTable,
            'sort_order' => 10,
            'is_active' => true,
            'is_public' => true,
        ]);

        return [$category, $subCategory];
    }
}
