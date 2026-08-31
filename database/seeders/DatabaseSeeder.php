<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionAndRoleSeeder::class,
            AdminUserSeeder::class,
            ServiceStructureSeeder::class,
            UserSeeder::class,
            ListingPriceRangeSeeder::class,
            LandingPageSeeder::class,
            DemoListingSeeder::class,
        ]);
    }
}
