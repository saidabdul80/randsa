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

    private const FIRST_NAMES = [
        'Amina',
        'Chinedu',
        'Tunde',
        'Fatima',
        'Ada',
        'Seyi',
        'Ifeoma',
        'Musa',
        'Kemi',
        'Emeka',
        'Zainab',
        'Damilola',
    ];

    private const LAST_NAMES = [
        'Okafor',
        'Balogun',
        'Ibrahim',
        'Eze',
        'Adebayo',
        'Udo',
        'Nwachukwu',
        'Bello',
        'Oladipo',
        'Etim',
        'Yakubu',
        'George',
    ];

    private const OWNER_LOCATIONS = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];

    private const STREET_NAMES = [
        'Admiralty Way',
        'Aminu Kano Crescent',
        'Adeniran Ogunsanya Street',
        'Sani Abacha Road',
        'Ring Road',
        'Bodija Avenue',
        'Nwaniba Road',
        'Trans Amadi Road',
        'Independence Avenue',
        'Zoo Road',
    ];

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
                'first_name' => $this->pick(self::FIRST_NAMES, $index),
                'last_name' => $this->pick(self::LAST_NAMES, $index),
                'phone' => sprintf('+23480%08d', $index),
                'location' => $this->pick(self::OWNER_LOCATIONS, $index),
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
        $subCategoryId = $this->pick([
            'housing_apartment_rent',
            'housing_house_sale',
            'housing_land_sale',
            'housing_shop_rent',
        ], $index);
        $subCategory = $subCategories->get($subCategoryId);
        if (! $subCategory) {
            return;
        }

        $location = $this->location($index);
        $bedrooms = $this->numberBetween(1, 6, $index, 11);
        $bathrooms = $this->numberBetween(max(1, $bedrooms - 1), $bedrooms + 1, $index, 12);
        $size = match ($subCategoryId) {
            'housing_land_sale' => $this->numberBetween(450, 2200, $index, 21),
            'housing_shop_rent' => $this->numberBetween(40, 420, $index, 22),
            default => $this->numberBetween(80, 520, $index, 23),
        };
        $propertyKind = match ($subCategoryId) {
            'housing_house_sale' => $this->pick(['detached duplex', 'terrace home', 'family bungalow', 'smart home'], $index),
            'housing_land_sale' => $this->pick(['dry land', 'corner-piece plot', 'commercial land', 'fenced estate plot'], $index),
            'housing_shop_rent' => $this->pick(['street-facing shop', 'office suite', 'retail space', 'warehouse unit'], $index),
            default => $this->pick(['serviced apartment', 'mini flat', 'penthouse', 'self-contained studio'], $index),
        };
        $title = match ($subCategoryId) {
            'housing_land_sale' => Str::headline("{$propertyKind} in {$location['area']}"),
            'housing_shop_rent' => Str::headline("{$propertyKind} for lease in {$location['area']}"),
            default => Str::headline("{$bedrooms} bedroom {$propertyKind} in {$location['area']}"),
        };

        $property = Property::query()->create([
            'owner_id' => $this->ownerFor($owners, $index)->id,
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
            'base_price' => $this->propertyPrice($subCategoryId, $index),
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
        $subCategoryId = $this->pick([
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
        ], $index);
        $subCategory = $subCategories->get($subCategoryId);
        if (! $subCategory) {
            return;
        }

        $location = $this->location($index + self::PROPERTY_RECORDS);
        $title = $this->marketplaceTitle($subCategoryId, $location['area'], $index);
        $basePrice = $this->marketplacePrice($subCategoryId, $index);

        $listing = MarketplaceListing::query()->create([
            'owner_id' => $this->ownerFor($owners, $index)->id,
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
            'negotiable' => $this->seededBoolean($index, 45),
            'contact_name' => $this->personName($index),
            'contact_phone' => sprintf('+23481%08d', $index),
            'whatsapp_enabled' => $this->seededBoolean($index, 75),
            'preferred_contact_method' => $this->pick(['phone', 'whatsapp'], $index),
            'delivery_available' => $this->seededBoolean($index, 55),
            'pickup_available' => true,
            'delivery_details' => 'Delivery or visit schedule is confirmed after contact.',
            'view_count' => $this->numberBetween(15, 1800, $index, 31),
            'favourite_count' => $this->numberBetween(0, 150, $index, 32),
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
            'address' => $this->numberBetween(1, 240, $index, 41).' '.$this->pick(self::STREET_NAMES, $index),
            'latitude' => $this->decimalBetween(4.8, 9.2, $index, 42),
            'longitude' => $this->decimalBetween(3.0, 8.8, $index, 43),
        ];
    }

    private function propertyPrice(string $subCategoryId, int $index): int
    {
        return match ($subCategoryId) {
            'housing_house_sale' => $this->numberBetween(35000000, 280000000, $index, 51),
            'housing_land_sale' => $this->numberBetween(7000000, 120000000, $index, 52),
            'housing_shop_rent' => $this->numberBetween(600000, 12000000, $index, 53),
            default => $this->numberBetween(350000, 12000000, $index, 54),
        };
    }

    private function marketplacePrice(string $subCategoryId, int $index): ?int
    {
        return match ($subCategoryId) {
            'artisan_plumbing', 'artisan_electrical', 'artisan_cleaning', 'artisan_beauty', 'artisan_carpentry', 'marketplace_home_services' => null,
            'rental_cars' => $this->numberBetween(25000, 160000, $index, 61),
            'rental_equipment' => $this->numberBetween(15000, 350000, $index, 62),
            'rental_event_space' => $this->numberBetween(150000, 2500000, $index, 63),
            'marketplace_furniture' => $this->numberBetween(45000, 2500000, $index, 64),
            'marketplace_electronics' => $this->numberBetween(35000, 1800000, $index, 65),
            default => $this->numberBetween(10000, 500000, $index, 66),
        };
    }

    private function marketplaceTitle(string $subCategoryId, string $area, int $index): string
    {
        $title = match ($subCategoryId) {
            'artisan_plumbing' => $this->pick(['Emergency plumbing repair', 'Water heater installation', 'Bathroom pipe replacement'], $index),
            'artisan_electrical' => $this->pick(['Certified electrician callout', 'Inverter and wiring service', 'Office lighting installation'], $index),
            'artisan_cleaning' => $this->pick(['Deep home cleaning team', 'Post-construction cleaning', 'Office cleaning package'], $index),
            'artisan_beauty' => $this->pick(['Mobile barber service', 'Makeup artist booking', 'Home nail technician'], $index),
            'artisan_carpentry' => $this->pick(['Kitchen cabinet carpenter', 'Wardrobe installation', 'Furniture repair specialist'], $index),
            'rental_cars' => $this->pick(['Toyota Corolla for daily hire', 'Lexus SUV chauffeur rental', 'Coaster bus for events'], $index),
            'rental_equipment' => $this->pick(['Generator rental', 'Scaffold and ladder hire', 'Sound system rental'], $index),
            'rental_event_space' => $this->pick(['Outdoor event garden', 'Banquet hall booking', 'Private meeting lounge'], $index),
            'marketplace_furniture' => $this->pick(['Luxury sofa set', 'Dining table set', 'Office workstation bundle'], $index),
            'marketplace_electronics' => $this->pick(['Smart TV and soundbar', 'Laptop workstation', 'Inverter battery pack'], $index),
            default => $this->pick(['Home support service', 'Errand and domestic assistance', 'Moving and setup service'], $index),
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
            $values['furnishing'] = ['value_string' => $this->pick(['Fully fitted', 'Semi furnished', 'Unfurnished'], $property->id)];
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

    private function pick(array $items, int $index): string
    {
        return $items[($index - 1) % count($items)];
    }

    private function numberBetween(int $min, int $max, int $index, int $salt = 0): int
    {
        $range = $max - $min + 1;
        $value = abs(($index * 1103515245) + ($salt * 12345) + 12345);

        return $min + ($value % $range);
    }

    private function decimalBetween(float $min, float $max, int $index, int $salt = 0): float
    {
        $basis = $this->numberBetween(0, 1000000, $index, $salt) / 1000000;

        return round($min + (($max - $min) * $basis), 7);
    }

    private function seededBoolean(int $index, int $truePercent): bool
    {
        return $this->numberBetween(1, 100, $index, 71) <= $truePercent;
    }

    private function personName(int $index): string
    {
        return $this->pick(self::FIRST_NAMES, $index).' '.$this->pick(self::LAST_NAMES, $index + 3);
    }

    private function ownerFor($owners, int $index): User
    {
        return $owners->values()[($index - 1) % $owners->count()];
    }
}
