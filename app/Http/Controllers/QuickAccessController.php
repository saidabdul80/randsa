<?php

namespace App\Http\Controllers;

use App\Actions\CreateCustomerAccount;
use App\Http\Requests\StoreQuickAccessRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class QuickAccessController extends Controller
{
    public function store(StoreQuickAccessRequest $request, CreateCustomerAccount $createCustomer): RedirectResponse
    {
        $validated = $request->validated();
        $user = $createCustomer->execute(
            (string) $validated['customer_name'],
            (string) $validated['customer_email'],
            (string) $validated['customer_phone'],
        );

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect()
            ->to($this->intendedPath($validated['intended_url'] ?? null))
            ->with('status', 'quick-access-created');
    }

    private function intendedPath(?string $path): string
    {
        if (! $path || ! Str::startsWith($path, '/') || Str::startsWith($path, '//')) {
            return route('home', absolute: false);
        }

        if (in_array($path, ['/login', '/register'], true)) {
            return route('home', absolute: false);
        }

        return $path;
    }
}
