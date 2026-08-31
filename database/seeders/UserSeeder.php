<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedCustomer(
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '+2349100000000',
            location: 'Lagos',
        );

        collect(range(1, 20))->each(function (int $index): void {
            $this->seedCustomer(
                email: sprintf('customer%02d@randsa.test', $index),
                firstName: fake()->firstName(),
                lastName: fake()->lastName(),
                phone: sprintf('+23491%08d', $index),
                location: fake()->randomElement(['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu']),
            );
        });
    }

    private function seedCustomer(
        string $email,
        string $firstName,
        string $lastName,
        string $phone,
        string $location,
    ): void {
        $user = User::query()->firstOrNew(['email' => $email]);
        if (! $user->exists) {
            $user->id = (string) Str::uuid();
        }

        $user->fill([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => $phone,
            'location' => $location,
            'is_verified' => true,
            'account_status' => 'active',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $user->save();

        $user->assignRole('customer');
    }
}
