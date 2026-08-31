<?php

namespace Database\Seeders;

use App\Models\LandingPageSection;
use Illuminate\Database\Seeder;

class LandingPageSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            [
                'section_key' => 'hero_slide',
                'eyebrow' => 'Housing',
                'title' => 'Find homes, shops, land, and inspections.',
                'description' => 'Search rent and sale listings, review property details, save options, and book inspections from one public marketplace.',
                'image_url' => '/images/seeded/home.webp',
                'sort_order' => 10,
            ],
            [
                'section_key' => 'hero_slide',
                'eyebrow' => 'Rentals',
                'title' => 'Rent what you need, when you need it.',
                'description' => 'Discover vehicles, equipment, spaces, and short-term rentals organized by clear service categories.',
                'image_url' => '/images/seeded/car.webp',
                'sort_order' => 20,
            ],
            [
                'section_key' => 'hero_slide',
                'eyebrow' => 'Events and services',
                'title' => 'Book spaces and trusted service renderers.',
                'description' => 'Find artisans, event vendors, professional services, and booking-enabled offers without hardcoded listing rules.',
                'image_url' => '/images/seeded/event.webp',
                'sort_order' => 30,
            ],
            [
                'section_key' => 'hero_slide',
                'eyebrow' => 'Marketplace',
                'title' => 'Every category, one place.',
                'description' => 'Browse housing, marketplace items, leisure, jobs, and services through one searchable landing page.',
                'image_url' => '/images/seeded/leisure.webp',
                'sort_order' => 40,
            ],
            [
                'section_key' => 'workflow_item',
                'title' => 'Search across listing kinds',
                'description' => 'Housing rent, property sales, marketplace rentals, and artisan services share one searchable public surface.',
                'sort_order' => 10,
            ],
            [
                'section_key' => 'workflow_item',
                'title' => 'Review service details',
                'description' => 'Compare photos, locations, prices, and service information before you contact or book.',
                'sort_order' => 20,
            ],
            [
                'section_key' => 'workflow_item',
                'title' => 'Book or contact cleanly',
                'description' => 'Book inspections and service appointments where enabled, or contact the provider through the listing workflow.',
                'sort_order' => 30,
            ],
            [
                'placement' => 'property_detail',
                'section_key' => 'property_trust_item',
                'title' => 'Inspection-first',
                'description' => 'Book an inspection before any payment.',
                'payload' => ['icon' => 'calendar'],
                'sort_order' => 10,
            ],
            [
                'placement' => 'property_detail',
                'section_key' => 'property_trust_item',
                'title' => 'Secure payments',
                'description' => 'Payments are recorded and traceable.',
                'payload' => ['icon' => 'shield'],
                'sort_order' => 20,
            ],
            [
                'placement' => 'property_detail',
                'section_key' => 'property_trust_item',
                'title' => 'Private contact',
                'description' => 'Seller details are shared only after booking.',
                'payload' => ['icon' => 'lock'],
                'sort_order' => 30,
            ],
            [
                'placement' => 'property_detail',
                'section_key' => 'property_trust_item',
                'title' => 'Expert support',
                'description' => 'Support is available through each step.',
                'payload' => ['icon' => 'headphones'],
                'sort_order' => 40,
            ],
        ];

        foreach ($sections as $section) {
            LandingPageSection::query()->updateOrCreate(
                [
                    'placement' => $section['placement'] ?? 'home',
                    'section_key' => $section['section_key'],
                    'sort_order' => $section['sort_order'],
                ],
                $section + [
                    'placement' => 'home',
                    'is_active' => true,
                ],
            );
        }
    }
}
