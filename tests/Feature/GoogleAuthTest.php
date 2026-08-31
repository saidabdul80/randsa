<?php

namespace Tests\Feature;

use App\Events\UserRegistered;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Mockery\MockInterface;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_google_callback_creates_and_authenticates_a_customer_account(): void
    {
        Event::fake([UserRegistered::class]);

        $googleUser = Mockery::mock(SocialiteUser::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getId')->andReturn('google-user-123');
            $mock->shouldReceive('getName')->andReturn('Ada Lovelace');
            $mock->shouldReceive('getNickname')->andReturn(null);
            $mock->shouldReceive('getEmail')->andReturn('ada@example.test');
            $mock->shouldReceive('getAvatar')->andReturn('https://example.test/avatar.jpg');
        });

        $provider = Mockery::mock(Provider::class, function (MockInterface $mock) use ($googleUser): void {
            $mock->shouldReceive('user')->once()->andReturn($googleUser);
        });

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get('/auth/google/callback')
            ->assertRedirect(route('home'));

        $user = User::query()->where('email', 'ada@example.test')->firstOrFail();

        $this->assertAuthenticatedAs($user);

        $this->assertSame('google-user-123', $user->google_id);
        $this->assertSame('Ada', $user->first_name);
        $this->assertSame('Lovelace', $user->last_name);
        $this->assertSame('https://example.test/avatar.jpg', $user->photo_url);
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue($user->hasRole('customer'));

        Event::assertDispatched(UserRegistered::class);
    }

    public function test_google_callback_links_an_existing_email_account(): void
    {
        $user = User::factory()->create([
            'email' => 'existing@example.test',
            'google_id' => null,
            'email_verified_at' => null,
            'photo_url' => null,
        ]);

        $googleUser = Mockery::mock(SocialiteUser::class, function (MockInterface $mock): void {
            $mock->shouldReceive('getId')->andReturn('google-existing-123');
            $mock->shouldReceive('getName')->andReturn('Existing User');
            $mock->shouldReceive('getNickname')->andReturn(null);
            $mock->shouldReceive('getEmail')->andReturn('existing@example.test');
            $mock->shouldReceive('getAvatar')->andReturn('https://example.test/existing.jpg');
        });

        $provider = Mockery::mock(Provider::class, function (MockInterface $mock) use ($googleUser): void {
            $mock->shouldReceive('user')->once()->andReturn($googleUser);
        });

        Socialite::shouldReceive('driver')->once()->with('google')->andReturn($provider);

        $this->get('/auth/google/callback')
            ->assertRedirect(route('home'));

        $user->refresh();

        $this->assertAuthenticatedAs($user);
        $this->assertSame('google-existing-123', $user->google_id);
        $this->assertSame('https://example.test/existing.jpg', $user->photo_url);
        $this->assertNotNull($user->email_verified_at);
    }
}
