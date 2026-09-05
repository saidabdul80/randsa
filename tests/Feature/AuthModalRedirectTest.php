<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthModalRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_can_redirect_back_to_modal_intended_page(): void
    {
        $user = User::factory()->create([
            'email' => 'modal-login@example.test',
            'password' => Hash::make('password'),
        ]);

        $this->post(route('login.store'), [
            'email' => 'modal-login@example.test',
            'password' => 'password',
            'intended_url' => '/listings/12',
        ])
            ->assertRedirect('/listings/12');

        $this->assertAuthenticatedAs($user);
    }

    public function test_register_modal_creates_customer_and_returns_to_page(): void
    {
        $this->post(route('register.store'), [
            'first_name' => 'Customer',
            'last_name' => 'User',
            'email' => 'modal-register@example.test',
            'phone' => '+2348012349876',
            'password' => 'password',
            'password_confirmation' => 'password',
            'terms_accepted' => true,
            'intended_url' => '/properties/7',
        ])
            ->assertRedirect('/properties/7');

        $user = User::query()->where('email', 'modal-register@example.test')->firstOrFail();

        $this->assertAuthenticatedAs($user);
        $this->assertSame('+2348012349876', $user->phone);
        $this->assertTrue($user->hasRole('customer'));
    }
}
