<?php

namespace App\Http\Controllers\Auth;

use App\Events\UserRegistered;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(): SymfonyRedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Google sign in could not be completed. Please try again.']);
        }

        $email = $googleUser->getEmail();

        if (! $email) {
            return redirect()
                ->route('login')
                ->withErrors(['email' => 'Google did not return an email address for this account.']);
        }

        $user = User::query()
            ->where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        $isNewUser = ! $user;
        [$firstName, $lastName] = $this->splitName($googleUser->getName() ?: $googleUser->getNickname() ?: $email);

        if (! $user) {
            $user = User::query()->create([
                'id' => (string) Str::uuid(),
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'email_verified_at' => now(),
                'google_id' => $googleUser->getId(),
                'photo_url' => $googleUser->getAvatar(),
                'password' => Hash::make(Str::password(32)),
                'account_status' => 'active',
                'terms_accepted_at' => now(),
            ]);

            $user->assignRole(Role::query()->firstOrCreate([
                'name' => 'customer',
                'guard_name' => 'web',
            ]));
        } else {
            $user->forceFill([
                'google_id' => $user->google_id ?: $googleUser->getId(),
                'photo_url' => $user->photo_url ?: $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?: now(),
            ])->save();
        }

        Auth::login($user, remember: true);
        request()->session()->regenerate();

        if ($isNewUser) {
            UserRegistered::dispatch($user);
        }

        return redirect()->intended(route('home'));
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = str($name)->squish()->explode(' ')->filter()->values();

        if ($parts->isEmpty()) {
            return ['Google', 'User'];
        }

        return [
            (string) $parts->first(),
            $parts->count() > 1 ? $parts->slice(1)->join(' ') : 'User',
        ];
    }
}
