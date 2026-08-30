<?php

use App\Events\UserRegistered;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Mockery\MockInterface;

test('google callback creates and authenticates a customer account', function () {
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

    expect($user)
        ->google_id->toBe('google-user-123')
        ->first_name->toBe('Ada')
        ->last_name->toBe('Lovelace')
        ->photo_url->toBe('https://example.test/avatar.jpg')
        ->email_verified_at->not->toBeNull();

    expect($user->hasRole('customer'))->toBeTrue();

    Event::assertDispatched(UserRegistered::class);
});

test('google callback links an existing email account', function () {
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

    expect($user)
        ->google_id->toBe('google-existing-123')
        ->photo_url->toBe('https://example.test/existing.jpg')
        ->email_verified_at->not->toBeNull();
});
