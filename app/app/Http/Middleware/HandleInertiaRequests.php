<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => fn () => $request->user() ? [
                    'id' => $request->user()->id,
                    'first_name' => $request->user()->first_name,
                    'middle_name' => $request->user()->middle_name,
                    'last_name' => $request->user()->last_name,
                    'name' => $request->user()->name,
                    'nin' => $request->user()->nin,
                    'nin_verified_at' => $request->user()->nin_verified_at,
                    'bvn' => $request->user()->bvn,
                    'bvn_verified_at' => $request->user()->bvn_verified_at,
                    'email' => $request->user()->email,
                    'email_verified_at' => $request->user()->email_verified_at,
                    'phone' => $request->user()->phone,
                    'phone_verified_at' => $request->user()->phone_verified_at,
                    'location' => $request->user()->location,
                    'bio' => $request->user()->bio,
                    'photo_url' => $request->user()->photo_url,
                    'is_verified' => $request->user()->is_verified,
                    'account_status' => $request->user()->account_status,
                    'terms_accepted_at' => $request->user()->terms_accepted_at,
                    'permissions' => method_exists($request->user(), 'getAllPermissions')
                        ? $request->user()->getAllPermissions()->pluck('name')->values()
                        : [],
                    'roles' => method_exists($request->user(), 'roles')
                        ? $request->user()->roles()->pluck('name')->values()
                        : [],
                ] : null,
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
        ];
    }
}
