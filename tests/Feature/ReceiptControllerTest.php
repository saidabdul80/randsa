<?php

namespace Tests\Feature;

use App\Mail\ReceiptIssuedMail;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Receipt;
use App\Models\ServiceCategory;
use App\Models\ServiceSubCategory;
use App\Models\User;
use Database\Seeders\PermissionAndRoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ReceiptControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_owner_can_issue_paid_receipt_for_booking_and_email_customer(): void
    {
        Mail::fake();
        $this->seed(PermissionAndRoleSeeder::class);

        [$owner, $booking] = $this->seedOwnerBooking();

        $this->actingAs($owner)
            ->post(route('receipts.store'), [
                'booking_id' => $booking->id,
                'property_id' => $booking->property_id,
                'receipt_type' => 'rent',
                'amount' => 1200000,
                'currency' => 'NGN',
                'payment_method' => 'bank_transfer',
                'payment_reference' => 'TRF-4455',
                'paid_at' => '2026-09-05',
                'period_start' => '2026-09-01',
                'period_end' => '2027-08-31',
                'notes' => 'Paid in full.',
                'send_email' => true,
            ])
            ->assertRedirect()
            ->assertSessionHas('status', 'receipt-issued');

        $receipt = Receipt::query()->firstOrFail();

        $this->assertSame($owner->id, $receipt->owner_id);
        $this->assertSame($booking->user_id, $receipt->user_id);
        $this->assertSame($booking->property_id, $receipt->property_id);
        $this->assertSame($booking->property->title, $receipt->item_title);
        $this->assertSame('TRF-4455', $receipt->payment_reference);
        $this->assertNotNull($receipt->sent_at);
        $this->assertMatchesRegularExpression('/^RCT-\d{8}-[A-Z0-9]{6}$/', $receipt->receipt_number);
        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
            'payment_status' => 'paid',
        ]);

        Mail::assertSent(ReceiptIssuedMail::class, fn (ReceiptIssuedMail $mail) => $mail->receipt->is($receipt));
    }

    public function test_owner_cannot_issue_receipt_for_another_owner_post(): void
    {
        Mail::fake();
        $this->seed(PermissionAndRoleSeeder::class);

        [, $booking] = $this->seedOwnerBooking();
        $otherOwner = User::factory()->create();
        $otherOwner->assignRole('provider');

        $this->actingAs($otherOwner)
            ->post(route('receipts.store'), [
                'booking_id' => $booking->id,
                'property_id' => $booking->property_id,
                'receipt_type' => 'rent',
                'amount' => 1200000,
                'currency' => 'NGN',
                'payment_method' => 'bank_transfer',
                'paid_at' => '2026-09-05',
            ])
            ->assertSessionHasErrors(['booking_id']);

        $this->assertDatabaseCount('receipts', 0);
        Mail::assertNothingSent();
    }

    public function test_receipts_page_shows_owner_booked_customers_and_receipts(): void
    {
        $this->seed(PermissionAndRoleSeeder::class);

        [$owner, $booking] = $this->seedOwnerBooking();
        Receipt::query()->create([
            'receipt_number' => 'RCT-20260905-ABC123',
            'owner_id' => $owner->id,
            'user_id' => $booking->user_id,
            'booking_id' => $booking->id,
            'property_id' => $booking->property_id,
            'receipt_type' => 'rent',
            'status' => 'issued',
            'item_title' => $booking->property->title,
            'issuer_name' => $owner->name,
            'issuer_email' => $owner->email,
            'customer_name' => $booking->customer_name,
            'customer_email' => $booking->customer_email,
            'property_address' => '10 Admiralty Way, Lekki',
            'line_items' => [['description' => $booking->property->title, 'amount' => 1200000, 'currency' => 'NGN']],
            'amount' => 1200000,
            'currency' => 'NGN',
            'payment_method' => 'bank_transfer',
            'paid_at' => '2026-09-05',
            'issued_at' => '2026-09-05',
        ]);

        $this->actingAs($owner)
            ->get(route('receipts'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('ReceiptsPage')
                ->has('properties.data', 1)
                ->has('marketplaceListings.data', 0)
                ->has('bookings.data', 1)
                ->has('receipts.data', 1)
                ->where('receipts.data.0.receipt_number', 'RCT-20260905-ABC123'));
    }

    public function test_receipt_selected_post_must_match_customer_booking(): void
    {
        Mail::fake();
        $this->seed(PermissionAndRoleSeeder::class);

        [$owner, $booking] = $this->seedOwnerBooking();
        $otherProperty = Property::query()->create([
            'owner_id' => $owner->id,
            'service_category_id' => $booking->property->service_category_id,
            'service_sub_category_id' => $booking->property->service_sub_category_id,
            'title' => 'Different flat in Ikeja',
            'description' => 'Another bookable housing post.',
            'state' => 'Lagos',
            'city' => 'Lagos',
            'area' => 'Ikeja',
            'address' => '20 Allen Avenue',
            'status' => 'approved',
            'is_available' => true,
            'base_price' => 900000,
            'currency' => 'NGN',
            'pricing_unit' => 'year',
        ]);

        $this->actingAs($owner)
            ->post(route('receipts.store'), [
                'booking_id' => $booking->id,
                'property_id' => $otherProperty->id,
                'receipt_type' => 'rent',
                'amount' => 1200000,
                'currency' => 'NGN',
                'payment_method' => 'bank_transfer',
                'paid_at' => '2026-09-05',
            ])
            ->assertSessionHasErrors(['booking_id']);

        $this->assertDatabaseCount('receipts', 0);
        Mail::assertNothingSent();
    }

    private function seedOwnerBooking(): array
    {
        [$category, $subCategory] = $this->seedHousingCategory();
        $owner = User::factory()->create([
            'first_name' => 'Ada',
            'last_name' => 'Owner',
            'email' => 'owner@example.test',
            'phone' => '+2348011111111',
        ]);
        $owner->assignRole('provider');
        $customer = User::factory()->create([
            'first_name' => 'Musa',
            'last_name' => 'Tenant',
            'email' => 'tenant@example.test',
            'phone' => '+2348022222222',
        ]);
        $property = Property::query()->create([
            'owner_id' => $owner->id,
            'service_category_id' => $category->id,
            'service_sub_category_id' => $subCategory->id,
            'title' => 'Three bedroom flat in Lekki',
            'description' => 'A bookable housing post.',
            'state' => 'Lagos',
            'city' => 'Lagos',
            'area' => 'Lekki',
            'address' => '10 Admiralty Way',
            'status' => 'approved',
            'is_available' => true,
            'base_price' => 1200000,
            'currency' => 'NGN',
            'pricing_unit' => 'year',
        ]);
        $booking = Booking::query()->create([
            'user_id' => $customer->id,
            'property_id' => $property->id,
            'service_category_id' => $category->id,
            'service_sub_category_id' => $subCategory->id,
            'booking_mode' => 'inspection',
            'inspection_date' => '2026-09-05',
            'inspection_time' => '10:00',
            'duration_minutes' => 60,
            'quantity' => 1,
            'pricing_unit' => 'year',
            'estimated_total' => 1200000,
            'status' => 'pending',
            'payment_status' => 'pending',
            'customer_name' => $customer->name,
            'customer_email' => $customer->email,
            'customer_phone' => $customer->phone,
            'request_id' => 'booking-test',
            'schema_version' => 3,
        ]);

        return [$owner, $booking->load(['property', 'user'])];
    }

    private function seedHousingCategory(): array
    {
        $category = ServiceCategory::query()->create([
            'id' => 'receipt_housing',
            'name' => 'receipt_housing',
            'label' => 'Housing',
            'slug' => 'receipt-housing',
            'type' => 'housing',
            'sort_order' => 10,
            'is_active' => true,
            'is_public' => true,
        ]);

        $subCategory = ServiceSubCategory::query()->create([
            'id' => 'receipt_housing_rent',
            'service_category_id' => $category->id,
            'name' => 'receipt_housing_rent',
            'label' => 'Rent',
            'slug' => 'receipt-housing-rent',
            'type' => 'housing_rent',
            'transaction_type' => 'rent',
            'provider_kind' => 'user',
            'default_listing_table' => 'properties',
            'sort_order' => 10,
            'is_active' => true,
            'is_public' => true,
        ]);

        return [$category, $subCategory];
    }
}
