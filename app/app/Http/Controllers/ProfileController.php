<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Resources\UserProfileResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class ProfileController extends Controller
{
    public function show(Request $request): Response
    {
        return inertia('ProfilePage', [
            'profile' => new UserProfileResource($request->user()->load(['roles', 'permissions'])),
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        return back()->with('status', 'profile-updated');
    }
}
