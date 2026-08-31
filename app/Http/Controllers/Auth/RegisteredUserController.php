<?php

namespace App\Http\Controllers\Auth;

use App\Events\UserRegistered;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class RegisteredUserController extends Controller
{
    public function store(RegisterRequest $request): RedirectResponse
    {
        $user = User::query()->create([
            'id' => (string) Str::uuid(),
            'first_name' => $request->string('first_name'),
            'middle_name' => $request->input('middle_name'),
            'last_name' => $request->string('last_name'),
            'nin' => $request->input('nin'),
            'bvn' => $request->input('bvn'),
            'email' => $request->string('email'),
            'password' => $request->string('password'),
            'phone' => $request->input('phone'),
            'location' => $request->input('location'),
            'terms_accepted_at' => now(),
        ]);

        Auth::login($user);

        UserRegistered::dispatch($user);

        return redirect()->route('home');
    }
}
