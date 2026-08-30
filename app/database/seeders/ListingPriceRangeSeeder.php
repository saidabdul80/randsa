<?php

namespace Database\Seeders;

use App\Models\ListingPriceRange;
use Illuminate\Database\Seeder;

class ListingPriceRangeSeeder extends Seeder
{
    public function run(): void
    {
        $ranges = [
            ['id' => 'under_250k', 'label' => 'Under NGN 250,000', 'min_amount' => null, 'max_amount' => 249999.99, 'sort_order' => 10],
            ['id' => '250k_to_1m', 'label' => 'NGN 250,000 - 1M', 'min_amount' => 250000, 'max_amount' => 999999.99, 'sort_order' => 20],
            ['id' => 'above_1m', 'label' => 'NGN 1M and above', 'min_amount' => 1000000, 'max_amount' => null, 'sort_order' => 30],
        ];

        foreach ($ranges as $range) {
            ListingPriceRange::query()->updateOrCreate(
                ['id' => $range['id']],
                $range + [
                    'currency' => 'NGN',
                    'is_active' => true,
                    'is_public' => true,
                ],
            );
        }
    }
}
