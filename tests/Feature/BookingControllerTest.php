<?php

namespace Tests\Feature;

use App\Events\BookingCreated;
use App\Events\UserRegistered;
use App\Models\Property;
use App\Models\ServiceCategory;
use App\Models\ServiceSubCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BookingControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_booking_page_opens_without_authentication(): void
    {
        $property = $this->createBookableProperty();

        $this->get(route('booking', ['property' => $property]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('BookingPage')
                ->where('property.data.id', $property->id)
            );
    }

    public function test_contact_request_creates_customer_user_and_booking(): void
    {
        Event::fake([BookingCreated::class, UserRegistered::class]);
        $property = $this->createBookableProperty();

        $this->from(route('home'))->post(route('bookings.store'), [
            ...$this->validBookingPayload($property),
            'customer_name' => 'Amina Bello',
            'customer_email' => 'amina@example.test',
            'customer_phone' => '+2348011112222',
            'redirect_to' => 'back',
        ])
            ->assertRedirect(route('home'))
            ->assertSessionHas('status', 'booking-created');

        $user = User::query()->where('email', 'amina@example.test')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertSame('Amina', $user->first_name);
        $this->assertSame('Bello', $user->last_name);
        $this->assertSame('+2348011112222', $user->phone);
        $this->assertTrue($user->hasRole('customer'));
        $this->assertDatabaseHas('bookings', [
            'user_id' => $user->id,
            'property_id' => $property->id,
            'customer_name' => 'Amina Bello',
            'customer_email' => 'amina@example.test',
            'customer_phone' => '+2348011112222',
            'status' => 'pending',
            'payment_status' => 'pending',
        ]);

        Event::assertDispatched(BookingCreated::class);
        Event::assertDispatched(UserRegistered::class);
    }

    public function test_contact_request_requires_name_email_and_phone(): void
    {
        $property = $this->createBookableProperty();

        $this->from(route('home'))->post(route('bookings.store'), [
            ...$this->validBookingPayload($property),
            'redirect_to' => 'back',
        ])
            ->assertRedirect(route('home'))
            ->assertSessionHasErrors(['customer_name', 'customer_email', 'customer_phone']);

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_contact_request_rejects_existing_email_without_authentication(): void
    {
        $property = $this->createBookableProperty();
        User::factory()->create([
            'email' => 'existing@example.test',
            'phone' => '+2348099998888',
        ]);

        $this->from(route('home'))->post(route('bookings.store'), [
            ...$this->validBookingPayload($property),
            'customer_name' => 'Existing Customer',
            'customer_email' => 'existing@example.test',
            'customer_phone' => '+2348011112222',
            'redirect_to' => 'back',
        ])
            ->assertRedirect(route('home'))
            ->assertSessionHasErrors(['customer_email']);

        $this->assertDatabaseCount('bookings', 0);
    }

    private function createBookableProperty(): Property
    {
        $owner = User::factory()->create();
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
        $subCategory = ServiceSubCategory::query()->create([
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

        return Property::query()->create([
            'owner_id' => $owner->id,
            'service_category_id' => $category->id,
            'service_sub_category_id' => $subCategory->id,
            'title' => 'Lekki inspection apartment',
            'description' => 'Serviced apartment in Lekki',
            'state' => 'Lagos',
            'city' => 'Lagos',
            'area' => 'Lekki',
            'status' => 'approved',
            'is_available' => true,
            'base_price' => 180000,
            'currency' => 'NGN',
            'pricing_unit' => 'month',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validBookingPayload(Property $property): array
    {
        return [
            'property_id' => $property->id,
            'marketplace_listing_id' => null,
            'service_category_id' => $property->service_category_id,
            'service_sub_category_id' => $property->service_sub_category_id,
            'booking_mode' => 'inspection',
            'inspection_date' => now()->addDay()->toDateString(),
            'inspection_time' => '10:00',
            'duration_minutes' => 60,
            'quantity' => 1,
            'pricing_unit' => $property->pricing_unit,
            'estimated_total' => $property->base_price,
            'notes' => 'Please call before arrival.',
        ];
    }
}
