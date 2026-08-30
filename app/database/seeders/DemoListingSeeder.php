<?php

namespace Database\Seeders;

use App\Models\MarketplaceListing;
use App\Models\Property;
use App\Models\ServiceSubCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoListingSeeder extends Seeder
{
    private const TOTAL_RECORDS = 500;

    private const PROPERTY_RECORDS = 220;

    private const SEED_MARK = 'seeded_randsa_demo';

    public function run(): void
    {
        Property::query()->where('legacy_category', self::SEED_MARK)->delete();
        MarketplaceListing::query()->where('legacy_category', self::SEED_MARK)->delete();
        $this->resetSqliteSequenceWhenEmpty();

        $owners = $this->owners();
        $propertySubCategories = ServiceSubCategory::query()
            ->where('default_listing_table', 'properties')
            ->get()
            ->keyBy('id');
        $listingSubCategories = ServiceSubCategory::query()
            ->where('default_listing_table', 'marketplace_listings')
            ->get()
            ->keyBy('id');

        for ($index = 1; $index <= self::TOTAL_RECORDS; $index++) {
            $index <= self::PROPERTY_RECORDS
                ? $this->createProperty($index, $owners, $propertySubCategories)
                : $this->createMarketplaceListing($index - self::PROPERTY_RECORDS, $owners, $listingSubCategories);
        }
    }

    private function owners()
    {
        return collect(range(1, 30))->map(function (int $index): User {
            $user = User::query()->firstOrNew(['email' => sprintf('provider%02d@randsa.test', $index)]);
            if (! $user->exists) {
                $user->id = (string) Str::uuid();
            }
            $user->fill([
                'first_name' => fake()->firstName(),
                'last_name' => fake()->lastName(),
                'phone' => sprintf('+23480%08d', $index),
                'location' => fake()->randomElement(['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu']),
                'bio' => 'Verified RANDSA provider for homes, services, and marketplace requests.',
                'is_verified' => true,
                'account_status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
            ]);
            $user->save();

            $user->assignRole('provider');

            return $user;
        });
    }

    private function resetSqliteSequenceWhenEmpty(): void
    {
        if (config('database.default') !== 'sqlite') {
            return;
        }

        if (Property::query()->count() === 0) {
            DB::statement("DELETE FROM sqlite_sequence WHERE name = 'properties'");
        }

        if (MarketplaceListing::query()->count() === 0) {
            DB::statement("DELETE FROM sqlite_sequence WHERE name = 'marketplace_listings'");
        }
    }

    private function createProperty(int $index, $owners, $subCategories): void
    {
        $subCategoryId = fake()->randomElement([
            'housing_apartment_rent',
            'housing_house_sale',
            'housing_land_sale',
            'housing_shop_rent',
        ]);
        $subCategory = $subCategories->get($subCategoryId);
        if (! $subCategory) {
            return;
        }

        $location = $this->location($index);
        $bedrooms = fake()->numberBetween(1, 6);
        $bathrooms = fake()->numberBetween(max(1, $bedrooms - 1), $bedrooms + 1);
        $size = match ($subCategoryId) {
            'housing_land_sale' => fake()->numberBetween(450, 2200),
            'housing_shop_rent' => fake()->numberBetween(40, 420),
            default => fake()->numberBetween(80, 520),
        };
        $propertyKind = match ($subCategoryId) {
            'housing_house_sale' => fake()->randomElement(['detached duplex', 'terrace home', 'family bungalow', 'smart home']),
            'housing_land_sale' => fake()->randomElement(['dry land', 'corner-piece plot', 'commercial land', 'fenced estate plot']),
            'housing_shop_rent' => fake()->randomElement(['street-facing shop', 'office suite', 'retail space', 'warehouse unit']),
            default => fake()->randomElement(['serviced apartment', 'mini flat', 'penthouse', 'self-contained studio']),
        };
        $title = match ($subCategoryId) {
            'housing_land_sale' => Str::headline("{$propertyKind} in {$location['area']}"),
            'housing_shop_rent' => Str::headline("{$propertyKind} for lease in {$location['area']}"),
            default => Str::headline("{$bedrooms} bedroom {$propertyKind} in {$location['area']}"),
        };

        $property = Property::query()->create([
            'owner_id' => $owners->random()->id,
            'service_category_id' => $subCategory->service_category_id,
            'service_sub_category_id' => $subCategory->id,
            'title' => $title.' #'.$index,
            'description' => $this->propertyDescription($title, $location),
            'state' => $location['state'],
            'city' => $location['city'],
            'area' => $location['area'],
            'address' => $location['address'],
            'latitude' => $location['latitude'],
            'longitude' => $location['longitude'],
            'owner_phone' => sprintf('+23470%08d', $index),
            'status' => 'approved',
            'is_available' => true,
            'base_price' => $this->propertyPrice($subCategoryId),
            'currency' => 'NGN',
            'pricing_unit' => in_array($subCategoryId, ['housing_apartment_rent', 'housing_shop_rent'], true) ? 'year' : null,
            'legacy_category' => self::SEED_MARK,
            'legacy_property_type' => $propertyKind,
            'created_at' => now()->subMinutes($index * 19),
            'updated_at' => now()->subMinutes($index * 13),
        ]);

        foreach ($this->propertyImageUrls($index) as $imageIndex => $url) {
            $property->images()->create([
                'url' => $url,
                'alt_text' => $property->title,
                'sort_order' => $imageIndex,
                'is_cover' => $imageIndex === 0,
            ]);
        }

        $this->createPropertyFieldValues($property, $subCategoryId, $propertyKind, $bedrooms, $bathrooms, $size);
    }

    private function createMarketplaceListing(int $index, $owners, $subCategories): void
    {
        $subCategoryId = fake()->randomElement([
            'artisan_plumbing',
            'artisan_electrical',
            'artisan_cleaning',
            'artisan_beauty',
            'artisan_carpentry',
            'rental_cars',
            'rental_equipment',
            'rental_event_space',
            'marketplace_furniture',
            'marketplace_electronics',
            'marketplace_home_services',
        ]);
        $subCategory = $subCategories->get($subCategoryId);
        if (! $subCategory) {
            return;
        }

        $location = $this->location($index + self::PROPERTY_RECORDS);
        $title = $this->marketplaceTitle($subCategoryId, $location['area'], $index);
        $basePrice = $this->marketplacePrice($subCategoryId);

        $listing = MarketplaceListing::query()->create([
            'owner_id' => $owners->random()->id,
            'service_category_id' => $subCategory->service_category_id,
            'service_sub_category_id' => $subCategory->id,
            'title' => $title,
            'description' => $this->marketplaceDescription($title, $subCategory->label, $location),
            'status' => 'active',
            'moderation_status' => 'approved',
            'country' => 'Nigeria',
            'state' => $location['state'],
            'city' => $location['city'],
            'area' => $location['area'],
            'address' => $location['address'],
            'latitude' => $location['latitude'],
            'longitude' => $location['longitude'],
            'currency' => 'NGN',
            'base_price' => $basePrice,
            'maximum_amount' => null,
            'price_type' => in_array($subCategory->transaction_type, ['service', 'hire', 'booking'], true) ? 'starting_from' : 'fixed',
            'billing_period' => $this->billingPeriod($subCategoryId),
            'negotiable' => fake()->boolean(45),
            'contact_name' => fake()->name(),
            'contact_phone' => sprintf('+23481%08d', $index),
            'whatsapp_enabled' => fake()->boolean(75),
            'preferred_contact_method' => fake()->randomElement(['phone', 'whatsapp']),
            'delivery_available' => fake()->boolean(55),
            'pickup_available' => true,
            'delivery_details' => 'Delivery or visit schedule is confirmed after contact.',
            'view_count' => fake()->numberBetween(15, 1800),
            'favourite_count' => fake()->numberBetween(0, 150),
            'published_at' => now()->subMinutes($index * 11),
            'legacy_category' => self::SEED_MARK,
            'legacy_sub_category' => $subCategoryId,
            'created_at' => now()->subMinutes($index * 17),
            'updated_at' => now()->subMinutes($index * 7),
        ]);

        $listing->images()->create([
            'url' => $this->imageUrl($subCategoryId, $index),
            'alt_text' => $listing->title,
            'sort_order' => 0,
            'is_cover' => true,
        ]);
    }

    private function location(int $index): array
    {
        $locations = [
            ['state' => 'Lagos', 'city' => 'Lagos', 'areas' => ['Lekki Phase 1', 'Yaba', 'Ikeja GRA', 'Surulere', 'Ajah', 'Victoria Island']],
            ['state' => 'FCT', 'city' => 'Abuja', 'areas' => ['Wuse 2', 'Gwarinpa', 'Maitama', 'Garki', 'Jabi', 'Lokogoma']],
            ['state' => 'Rivers', 'city' => 'Port Harcourt', 'areas' => ['GRA Phase 2', 'Trans Amadi', 'Ada George', 'Rumuola']],
            ['state' => 'Oyo', 'city' => 'Ibadan', 'areas' => ['Bodija', 'Akobo', 'Jericho', 'Oluyole']],
            ['state' => 'Kano', 'city' => 'Kano', 'areas' => ['Nassarawa GRA', 'Tarauni', 'Bompai', 'Kofar Ruwa']],
            ['state' => 'Enugu', 'city' => 'Enugu', 'areas' => ['Independence Layout', 'New Haven', 'GRA', 'Trans Ekulu']],
            ['state' => 'Akwa Ibom', 'city' => 'Uyo', 'areas' => ['Ewet Housing', 'Shelter Afrique', 'Osongama', 'Nwaniba']],
        ];

        $base = $locations[$index % count($locations)];
        $area = $base['areas'][$index % count($base['areas'])];

        return [
            'state' => $base['state'],
            'city' => $base['city'],
            'area' => $area,
            'address' => fake()->buildingNumber().' '.fake()->streetName(),
            'latitude' => fake()->latitude(4.8, 9.2),
            'longitude' => fake()->longitude(3.0, 8.8),
        ];
    }

    private function propertyPrice(string $subCategoryId): int
    {
        return match ($subCategoryId) {
            'housing_house_sale' => fake()->numberBetween(35000000, 280000000),
            'housing_land_sale' => fake()->numberBetween(7000000, 120000000),
            'housing_shop_rent' => fake()->numberBetween(600000, 12000000),
            default => fake()->numberBetween(350000, 12000000),
        };
    }

    private function marketplacePrice(string $subCategoryId): ?int
    {
        return match ($subCategoryId) {
            'artisan_plumbing', 'artisan_electrical', 'artisan_cleaning', 'artisan_beauty', 'artisan_carpentry', 'marketplace_home_services' => null,
            'rental_cars' => fake()->numberBetween(25000, 160000),
            'rental_equipment' => fake()->numberBetween(15000, 350000),
            'rental_event_space' => fake()->numberBetween(150000, 2500000),
            'marketplace_furniture' => fake()->numberBetween(45000, 2500000),
            'marketplace_electronics' => fake()->numberBetween(35000, 1800000),
            default => fake()->numberBetween(10000, 500000),
        };
    }

    private function marketplaceTitle(string $subCategoryId, string $area, int $index): string
    {
        $title = match ($subCategoryId) {
            'artisan_plumbing' => fake()->randomElement(['Emergency plumbing repair', 'Water heater installation', 'Bathroom pipe replacement']),
            'artisan_electrical' => fake()->randomElement(['Certified electrician callout', 'Inverter and wiring service', 'Office lighting installation']),
            'artisan_cleaning' => fake()->randomElement(['Deep home cleaning team', 'Post-construction cleaning', 'Office cleaning package']),
            'artisan_beauty' => fake()->randomElement(['Mobile barber service', 'Makeup artist booking', 'Home nail technician']),
            'artisan_carpentry' => fake()->randomElement(['Kitchen cabinet carpenter', 'Wardrobe installation', 'Furniture repair specialist']),
            'rental_cars' => fake()->randomElement(['Toyota Corolla for daily hire', 'Lexus SUV chauffeur rental', 'Coaster bus for events']),
            'rental_equipment' => fake()->randomElement(['Generator rental', 'Scaffold and ladder hire', 'Sound system rental']),
            'rental_event_space' => fake()->randomElement(['Outdoor event garden', 'Banquet hall booking', 'Private meeting lounge']),
            'marketplace_furniture' => fake()->randomElement(['Luxury sofa set', 'Dining table set', 'Office workstation bundle']),
            'marketplace_electronics' => fake()->randomElement(['Smart TV and soundbar', 'Laptop workstation', 'Inverter battery pack']),
            default => fake()->randomElement(['Home support service', 'Errand and domestic assistance', 'Moving and setup service']),
        };

        return "{$title} in {$area} #{$index}";
    }

    private function propertyDescription(string $title, array $location): string
    {
        return "{$title} located around {$location['area']}, {$location['city']}. The listing includes clear access, verified contact details, inspection availability, and practical information for interested customers.";
    }

    private function marketplaceDescription(string $title, string $service, array $location): string
    {
        return "{$title}. {$service} available around {$location['area']}, {$location['city']} with responsive contact, transparent pricing, and flexible scheduling.";
    }

    private function billingPeriod(string $subCategoryId): ?string
    {
        return match ($subCategoryId) {
            'rental_cars', 'rental_equipment' => 'day',
            'artisan_plumbing', 'artisan_electrical', 'artisan_cleaning', 'artisan_beauty', 'artisan_carpentry', 'marketplace_home_services' => 'visit',
            'rental_event_space' => 'event',
            default => null,
        };
    }

    private function imageUrl(string $kind, int $index): string
    {
        $images = [
            'property' => '/images/seeded/home.webp',
            'artisan_plumbing' => '/images/seeded/home.webp',
            'artisan_electrical' => '/images/seeded/home.webp',
            'artisan_cleaning' => '/images/seeded/home.webp',
            'artisan_beauty' => '/images/seeded/event.webp',
            'artisan_carpentry' => '/images/seeded/home.webp',
            'rental_cars' => '/images/seeded/car.webp',
            'rental_equipment' => '/images/seeded/car.webp',
            'rental_event_space' => '/images/seeded/event.webp',
            'marketplace_furniture' => '/images/seeded/home.webp',
            'marketplace_electronics' => '/images/seeded/home.webp',
            'marketplace_home_services' => '/images/seeded/home.webp',
        ];

        return $images[$kind] ?? ($index % 2 === 0 ? '/images/seeded/event.webp' : '/images/seeded/leisure.webp');
    }

    private function propertyImageUrls(int $index): array
    {
        $images = [
            '/images/seeded/home.webp',
            '/images/seeded/leisure.webp',
            '/images/seeded/event.webp',
            '/images/seeded/home.webp',
            '/images/seeded/leisure.webp',
        ];

        return $index % 3 === 0 ? array_slice($images, 0, 3) : $images;
    }

    private function createPropertyFieldValues(Property $property, string $subCategoryId, string $propertyKind, int $bedrooms, int $bathrooms, int $size): void
    {
        $values = [
            'property_type' => ['value_string' => Str::headline($propertyKind)],
            'size' => ['value_number' => $size],
            'availability_status' => ['value_string' => 'available'],
            'verified_listing' => ['value_string' => 'Quality checked'],
            'clear_access' => ['value_string' => 'Well connected'],
            'secure_area' => ['value_string' => 'Peaceful neighbourhood'],
        ];

        if (in_array($subCategoryId, ['housing_apartment_rent', 'housing_house_sale'], true)) {
            $values['bedrooms'] = ['value_number' => $bedrooms];
            $values['bathrooms'] = ['value_number' => $bathrooms];
        }

        if ($subCategoryId !== 'housing_land_sale') {
            $values['furnishing'] = ['value_string' => fake()->randomElement(['Fully fitted', 'Semi furnished', 'Unfurnished'])];
        }

        if (in_array($subCategoryId, ['housing_house_sale', 'housing_land_sale'], true)) {
            $values['title_available'] = ['value_string' => 'Documentation ready'];
        }

        foreach ($values as $fieldId => $attributes) {
            $property->fieldValues()->create(array_merge([
                'service_field_id' => $fieldId,
                'field_key' => $fieldId,
            ], $attributes));
        }
    }
}
