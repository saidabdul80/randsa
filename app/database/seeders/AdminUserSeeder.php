<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admins = [
            [
                'email' => 'admin@example.com',
                'first_name' => 'Randsa',
                'last_name' => 'Admin',
                'phone' => '+2348000000000',
                'location' => 'Lagos',
            ],
        ];

        foreach ($admins as $admin) {
            $user = User::query()->firstOrNew(['email' => $admin['email']]);
            if (! $user->exists) {
                $user->id = (string) Str::uuid();
            }

            $user->fill([
                'first_name' => $admin['first_name'],
                'last_name' => $admin['last_name'],
                'phone' => $admin['phone'],
                'location' => $admin['location'],
                'is_verified' => true,
                'account_status' => 'active',
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'terms_accepted_at' => now(),
                'password' => Hash::make('password'),
            ]);
            $user->save();

            $user->syncRoles(['admin']);
        }
    }
}
