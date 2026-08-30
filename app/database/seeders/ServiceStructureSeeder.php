<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use App\Models\ServiceDisplayField;
use App\Models\ServiceField;
use App\Models\ServiceSubCategory;
use App\Models\ServiceSubCategoryField;
use Illuminate\Database\Seeder;

class ServiceStructureSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'id' => 'housing',
                'label' => 'Housing',
                'description' => 'Homes, apartments, shops, land, and commercial spaces for rent or sale.',
                'type' => 'housing',
                'sub_categories' => [
                    ['id' => 'housing_apartment_rent', 'label' => 'Apartments for rent', 'type' => 'housing_rent', 'transaction_type' => 'rent', 'table' => 'properties'],
                    ['id' => 'housing_house_sale', 'label' => 'Homes for sale', 'type' => 'housing_sale', 'transaction_type' => 'sale', 'table' => 'properties'],
                    ['id' => 'housing_land_sale', 'label' => 'Land for sale', 'type' => 'housing_sale', 'transaction_type' => 'sale', 'table' => 'properties'],
                    ['id' => 'housing_shop_rent', 'label' => 'Shops and offices', 'type' => 'housing_rent', 'transaction_type' => 'lease', 'table' => 'properties'],
                ],
            ],
            [
                'id' => 'artisan_services',
                'label' => 'Artisan services',
                'description' => 'Skilled service renderers for repairs, installations, cleaning, beauty, and domestic support.',
                'type' => 'artisan_services',
                'sub_categories' => [
                    ['id' => 'artisan_plumbing', 'label' => 'Plumbers', 'type' => 'service_renderer', 'transaction_type' => 'service', 'table' => 'marketplace_listings'],
                    ['id' => 'artisan_electrical', 'label' => 'Electricians', 'type' => 'service_renderer', 'transaction_type' => 'service', 'table' => 'marketplace_listings'],
                    ['id' => 'artisan_cleaning', 'label' => 'Cleaning services', 'type' => 'service_renderer', 'transaction_type' => 'service', 'table' => 'marketplace_listings'],
                    ['id' => 'artisan_beauty', 'label' => 'Beauty and grooming', 'type' => 'service_renderer', 'transaction_type' => 'service', 'table' => 'marketplace_listings'],
                    ['id' => 'artisan_carpentry', 'label' => 'Carpenters', 'type' => 'service_renderer', 'transaction_type' => 'service', 'table' => 'marketplace_listings'],
                ],
            ],
            [
                'id' => 'rentals',
                'label' => 'Rentals',
                'description' => 'Vehicles, equipment, event materials, and short-term hire services.',
                'type' => 'rentals',
                'sub_categories' => [
                    ['id' => 'rental_cars', 'label' => 'Car rentals', 'type' => 'rental', 'transaction_type' => 'hire', 'table' => 'marketplace_listings'],
                    ['id' => 'rental_equipment', 'label' => 'Equipment rentals', 'type' => 'rental', 'transaction_type' => 'hire', 'table' => 'marketplace_listings'],
                    ['id' => 'rental_event_space', 'label' => 'Event spaces', 'type' => 'event', 'transaction_type' => 'booking', 'table' => 'marketplace_listings'],
                ],
            ],
            [
                'id' => 'marketplace',
                'label' => 'Marketplace',
                'description' => 'Items and services customers can buy, hire, book, or request.',
                'type' => 'marketplace',
                'sub_categories' => [
                    ['id' => 'marketplace_furniture', 'label' => 'Furniture and appliances', 'type' => 'marketplace', 'transaction_type' => 'sale', 'table' => 'marketplace_listings'],
                    ['id' => 'marketplace_electronics', 'label' => 'Electronics', 'type' => 'marketplace', 'transaction_type' => 'sale', 'table' => 'marketplace_listings'],
                    ['id' => 'marketplace_home_services', 'label' => 'Home services', 'type' => 'service_renderer', 'transaction_type' => 'service', 'table' => 'marketplace_listings'],
                ],
            ],
        ];

        foreach ($categories as $index => $category) {
            ServiceCategory::query()->updateOrCreate(
                ['id' => $category['id']],
                [
                    'name' => str_replace('-', '_', $category['id']),
                    'label' => $category['label'],
                    'description' => $category['description'],
                    'slug' => str_replace('_', '-', $category['id']),
                    'type' => $category['type'],
                    'sort_order' => ($index + 1) * 10,
                    'is_active' => true,
                    'is_public' => true,
                ],
            );

            foreach ($category['sub_categories'] as $subIndex => $subCategory) {
                ServiceSubCategory::query()->updateOrCreate(
                    ['id' => $subCategory['id']],
                    [
                        'service_category_id' => $category['id'],
                        'name' => $subCategory['id'],
                        'label' => $subCategory['label'],
                        'description' => $subCategory['label'].' available through verified RANDSA providers.',
                        'slug' => str_replace('_', '-', $subCategory['id']),
                        'keywords' => [$category['label'], $subCategory['label']],
                        'type' => $subCategory['type'],
                        'transaction_type' => $subCategory['transaction_type'],
                        'provider_kind' => $category['id'] === 'artisan_services' ? 'artisan' : 'user',
                        'fulfillment_mode' => 'direct',
                        'default_listing_table' => $subCategory['table'],
                        'default_status' => 'approved',
                        'requires_moderation' => true,
                        'requires_provider_verification' => $category['id'] === 'artisan_services',
                        'uses_service_area' => $category['id'] === 'artisan_services',
                        'is_bookable' => in_array($subCategory['transaction_type'], ['rent', 'service', 'booking', 'hire'], true),
                        'is_payable' => true,
                        'allows_private_document' => $category['id'] === 'housing',
                        'sort_order' => ($subIndex + 1) * 10,
                        'is_active' => true,
                        'is_public' => true,
                    ],
                );
            }
        }

        $this->seedPropertyFieldConfiguration();
    }

    private function seedPropertyFieldConfiguration(): void
    {
        $fields = [
            'property_type' => ['label' => 'Property type', 'field_type' => 'text', 'data_type' => 'string'],
            'bedrooms' => ['label' => 'Bedrooms', 'field_type' => 'number', 'data_type' => 'integer'],
            'bathrooms' => ['label' => 'Bathrooms', 'field_type' => 'number', 'data_type' => 'integer'],
            'size' => ['label' => 'Size', 'field_type' => 'number', 'data_type' => 'decimal'],
            'furnishing' => ['label' => 'Furnishing', 'field_type' => 'text', 'data_type' => 'string'],
            'availability_status' => ['label' => 'Status', 'field_type' => 'text', 'data_type' => 'string'],
            'verified_listing' => ['label' => 'Verified listing', 'field_type' => 'text', 'data_type' => 'string'],
            'clear_access' => ['label' => 'Clear access', 'field_type' => 'text', 'data_type' => 'string'],
            'secure_area' => ['label' => 'Secure area', 'field_type' => 'text', 'data_type' => 'string'],
            'title_available' => ['label' => 'Title available', 'field_type' => 'text', 'data_type' => 'string'],
        ];

        foreach ($fields as $key => $field) {
            ServiceField::query()->updateOrCreate(
                ['id' => $key],
                [
                    'key' => $key,
                    'label' => $field['label'],
                    'management_label' => $field['label'],
                    'field_type' => $field['field_type'],
                    'data_type' => $field['data_type'],
                    'is_system' => false,
                    'is_active' => true,
                ],
            );
        }

        $subCategoryFields = [
            'housing_apartment_rent' => ['property_type', 'bedrooms', 'bathrooms', 'size', 'furnishing', 'availability_status', 'verified_listing', 'clear_access', 'secure_area'],
            'housing_house_sale' => ['property_type', 'bedrooms', 'bathrooms', 'size', 'furnishing', 'availability_status', 'verified_listing', 'clear_access', 'secure_area', 'title_available'],
            'housing_land_sale' => ['property_type', 'size', 'availability_status', 'verified_listing', 'clear_access', 'secure_area', 'title_available'],
            'housing_shop_rent' => ['property_type', 'size', 'furnishing', 'availability_status', 'verified_listing', 'clear_access', 'secure_area'],
        ];

        foreach ($subCategoryFields as $subCategoryId => $fieldIds) {
            foreach ($fieldIds as $index => $fieldId) {
                ServiceSubCategoryField::query()->updateOrCreate(
                    [
                        'service_sub_category_id' => $subCategoryId,
                        'service_field_id' => $fieldId,
                    ],
                    [
                        'id' => "{$subCategoryId}_{$fieldId}",
                        'field_group' => in_array($fieldId, ['verified_listing', 'clear_access', 'secure_area', 'title_available'], true) ? 'features' : 'details',
                        'is_required' => in_array($fieldId, ['property_type', 'availability_status'], true),
                        'is_filterable' => in_array($fieldId, ['bedrooms', 'bathrooms', 'property_type'], true),
                        'is_searchable' => in_array($fieldId, ['property_type', 'furnishing'], true),
                        'is_displayed_on_card' => in_array($fieldId, ['bedrooms', 'bathrooms', 'size'], true),
                        'is_displayed_on_details' => true,
                        'sort_order' => ($index + 1) * 10,
                    ],
                );
            }
        }

        $displayConfig = [
            'housing_apartment_rent' => [
                ['hero', 'bedrooms', 'Bedrooms', 'integer', 'bed', 10],
                ['hero', 'bathrooms', 'Bathrooms', 'integer', 'bath', 20],
                ['hero', 'size', 'SQM', 'integer', 'area', 30],
                ['hero', 'property_type', 'Type', 'text', 'home', 40],
                ['hero', 'availability_status', 'Status', 'status', 'status', 50],
                ['card', 'bedrooms', 'Beds', 'integer', 'bed', 10],
                ['card', 'bathrooms', 'Baths', 'integer', 'bath', 20],
                ['card', 'size', 'SQM', 'integer', 'area', 30],
                ['details', 'property_type', 'Property type', 'text', 'home', 10],
                ['details', 'bedrooms', 'Bedrooms', 'integer', 'bed', 20],
                ['details', 'bathrooms', 'Bathrooms', 'integer', 'bath', 30],
                ['details', 'size', 'Size', 'area_sqm', 'area', 40],
                ['details', 'furnishing', 'Furnishing', 'text', 'furnishing', 50],
                ['details', 'availability_status', 'Status', 'status', 'status', 60],
                ['highlights', 'verified_listing', 'Verified listing', 'text', 'verified_listing', 10],
                ['highlights', 'clear_access', 'Clear access', 'text', 'clear_access', 20],
                ['highlights', 'secure_area', 'Secure area', 'text', 'secure_area', 30],
            ],
            'housing_house_sale' => [
                ['hero', 'bedrooms', 'Bedrooms', 'integer', 'bed', 10],
                ['hero', 'bathrooms', 'Bathrooms', 'integer', 'bath', 20],
                ['hero', 'size', 'SQM', 'integer', 'area', 30],
                ['hero', 'property_type', 'Type', 'text', 'home', 40],
                ['hero', 'availability_status', 'Status', 'status', 'status', 50],
                ['card', 'bedrooms', 'Beds', 'integer', 'bed', 10],
                ['card', 'bathrooms', 'Baths', 'integer', 'bath', 20],
                ['card', 'size', 'SQM', 'integer', 'area', 30],
                ['details', 'property_type', 'Property type', 'text', 'home', 10],
                ['details', 'bedrooms', 'Bedrooms', 'integer', 'bed', 20],
                ['details', 'bathrooms', 'Bathrooms', 'integer', 'bath', 30],
                ['details', 'size', 'Size', 'area_sqm', 'area', 40],
                ['details', 'furnishing', 'Furnishing', 'text', 'furnishing', 50],
                ['details', 'availability_status', 'Status', 'status', 'status', 60],
                ['highlights', 'verified_listing', 'Verified listing', 'text', 'verified_listing', 10],
                ['highlights', 'clear_access', 'Clear access', 'text', 'clear_access', 20],
                ['highlights', 'secure_area', 'Secure area', 'text', 'secure_area', 30],
                ['highlights', 'title_available', 'Title available', 'text', 'title_available', 40],
            ],
            'housing_land_sale' => [
                ['hero', 'size', 'SQM', 'integer', 'area', 10],
                ['hero', 'property_type', 'Type', 'text', 'land', 20],
                ['hero', 'availability_status', 'Status', 'status', 'status', 30],
                ['card', 'size', 'SQM', 'integer', 'area', 10],
                ['details', 'property_type', 'Property type', 'text', 'land', 10],
                ['details', 'size', 'Size', 'area_sqm', 'area', 20],
                ['details', 'availability_status', 'Status', 'status', 'status', 30],
                ['highlights', 'verified_listing', 'Verified listing', 'text', 'verified_listing', 10],
                ['highlights', 'clear_access', 'Clear access', 'text', 'clear_access', 20],
                ['highlights', 'secure_area', 'Secure area', 'text', 'secure_area', 30],
                ['highlights', 'title_available', 'Title available', 'text', 'title_available', 40],
            ],
            'housing_shop_rent' => [
                ['hero', 'size', 'SQM', 'integer', 'area', 10],
                ['hero', 'property_type', 'Type', 'text', 'shop', 20],
                ['hero', 'availability_status', 'Status', 'status', 'status', 30],
                ['card', 'size', 'SQM', 'integer', 'area', 10],
                ['details', 'property_type', 'Property type', 'text', 'shop', 10],
                ['details', 'size', 'Size', 'area_sqm', 'area', 20],
                ['details', 'furnishing', 'Furnishing', 'text', 'furnishing', 30],
                ['details', 'availability_status', 'Status', 'status', 'status', 40],
                ['highlights', 'verified_listing', 'Verified listing', 'text', 'verified_listing', 10],
                ['highlights', 'clear_access', 'Clear access', 'text', 'clear_access', 20],
                ['highlights', 'secure_area', 'Secure area', 'text', 'secure_area', 30],
            ],
        ];

        foreach ($displayConfig as $subCategoryId => $displayFields) {
            foreach ($displayFields as [$area, $fieldId, $label, $format, $icon, $sortOrder]) {
                ServiceDisplayField::query()->updateOrCreate(
                    [
                        'service_sub_category_id' => $subCategoryId,
                        'service_field_id' => $fieldId,
                        'display_area' => $area,
                    ],
                    [
                        'id' => "{$subCategoryId}_{$area}_{$fieldId}",
                        'label' => $label,
                        'icon_key' => $icon,
                        'format' => $format,
                        'sort_order' => $sortOrder,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
