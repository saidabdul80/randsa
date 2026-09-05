<?php

namespace Tests\Feature;

use App\Events\UserRegistered;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class QuickAccessControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_quick_access_creates_customer_user_and_continues_to_intended_path(): void
    {
        Event::fake([UserRegistered::class]);

        $this->post(route('quick-access.store'), [
            'customer_name' => 'Musa Danjuma',
            'customer_email' => 'musa@example.test',
            'customer_phone' => '+2348022223333',
            'intended_url' => '/my-bookings',
        ])
            ->assertRedirect('/my-bookings')
            ->assertSessionHas('status', 'quick-access-created');

        $user = User::query()->where('email', 'musa@example.test')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertSame('Musa', $user->first_name);
        $this->assertSame('Danjuma', $user->last_name);
        $this->assertSame('+2348022223333', $user->phone);
        $this->assertTrue($user->hasRole('customer'));

        Event::assertDispatched(UserRegistered::class);
    }

    public function test_quick_access_rejects_existing_email(): void
    {
        User::factory()->create([
            'email' => 'existing@example.test',
        ]);

        $this->post(route('quick-access.store'), [
            'customer_name' => 'Existing User',
            'customer_email' => 'existing@example.test',
            'customer_phone' => '+2348033334444',
            'intended_url' => '/saved-properties',
        ])
            ->assertRedirect()
            ->assertSessionHasErrors(['customer_email']);

        $this->assertGuest();
    }

    public function test_quick_access_falls_back_to_home_for_external_intended_url(): void
    {
        $this->post(route('quick-access.store'), [
            'customer_name' => 'Safe Redirect',
            'customer_email' => 'safe@example.test',
            'customer_phone' => '+2348044445555',
            'intended_url' => 'https://example.test/my-bookings',
        ])
            ->assertRedirect(route('home', absolute: false));

        $this->assertAuthenticated();
    }
}
