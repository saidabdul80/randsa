<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canViewSensitiveIdentity = $request->user()?->id === $this->id
            || (bool) $request->user()?->can('admin.access');

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'name' => $this->name,
            'nin' => $this->when($canViewSensitiveIdentity, $this->nin),
            'nin_verified_at' => $this->when($canViewSensitiveIdentity, $this->nin_verified_at),
            'bvn' => $this->when($canViewSensitiveIdentity, $this->bvn),
            'bvn_verified_at' => $this->when($canViewSensitiveIdentity, $this->bvn_verified_at),
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'phone' => $this->phone,
            'phone_verified_at' => $this->phone_verified_at,
            'location' => $this->location,
            'bio' => $this->bio,
            'photo_url' => $this->photo_url,
            'is_verified' => $this->is_verified,
            'account_status' => $this->account_status,
            'terms_accepted_at' => $this->terms_accepted_at,
            'permissions' => $this->when(
                $this->relationLoaded('permissions'),
                fn () => $this->permissions->pluck('name')->values(),
            ),
            'roles' => $this->when(
                $this->relationLoaded('roles'),
                fn () => $this->roles->pluck('name')->values(),
            ),
        ];
    }
}
