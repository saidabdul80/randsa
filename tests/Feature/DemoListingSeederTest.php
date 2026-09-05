<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\MarketplaceListing;
use App\Models\Property;
use App\Models\Receipt;
use Database\Seeders\DemoListingSeeder;
use Database\Seeders\PermissionAndRoleSeeder;
use Database\Seeders\ServiceStructureSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoListingSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_listing_seeder_adds_booking_availability(): void
    {
        $this->seed(PermissionAndRoleSeeder::class);
        $this->seed(ServiceStructureSeeder::class);
        $this->seed(DemoListingSeeder::class);

        $property = Property::query()
            ->where('legacy_category', 'seeded_randsa_demo')
            ->firstOrFail();
        $listing = MarketplaceListing::query()
            ->where('legacy_category', 'seeded_randsa_demo')
            ->firstOrFail();

        $this->assertNotEmpty($property->availability_slots);
        $this->assertNotEmpty($property->availability_rules);
        $this->assertNotEmpty($listing->availability_slots);
        $this->assertNotEmpty($listing->availability_rules);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $property->availability_slots[0]['date']);
        $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $listing->availability_rules[0]['times'][0]);
        $this->assertGreaterThan(1, $property->images()->count());
        $this->assertGreaterThan(1, $listing->images()->count());
        $this->assertGreaterThanOrEqual(70, Booking::query()->where('request_id', 'like', 'seeded_randsa_demo-%')->count());
        $this->assertGreaterThanOrEqual(40, Receipt::query()->whereHas('booking', fn ($query) => $query->where('request_id', 'like', 'seeded_randsa_demo-%'))->count());
        $this->assertDatabaseHas('receipts', [
            'property_id' => $property->id,
            'item_title' => $property->title,
            'currency' => 'NGN',
        ]);
    }
}
