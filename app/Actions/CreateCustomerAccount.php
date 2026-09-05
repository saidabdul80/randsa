<?php

namespace App\Actions;

use App\Events\UserRegistered;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class CreateCustomerAccount
{
    /**
     * Create a low-friction customer account that can be completed later.
     */
    public function execute(string $name, string $email, string $phone): User
    {
        [$firstName, $lastName] = $this->splitName($name);
        $user = User::query()->create([
            'id' => (string) Str::uuid(),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'password' => Hash::make(Str::password(32)),
            'account_status' => 'active',
        ]);

        $user->assignRole(Role::query()->firstOrCreate([
            'name' => 'customer',
            'guard_name' => 'web',
        ]));

        UserRegistered::dispatch($user);

        return $user;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitName(string $name): array
    {
        $parts = str($name)->squish()->explode(' ')->filter()->values();

        if ($parts->isEmpty()) {
            return ['Customer', 'User'];
        }

        return [
            (string) $parts->first(),
            $parts->count() > 1 ? $parts->slice(1)->join(' ') : 'User',
        ];
    }
}
