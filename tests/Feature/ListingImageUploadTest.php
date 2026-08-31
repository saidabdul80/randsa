<?php

use App\Models\Property;
use App\Models\ServiceCategory;
use App\Models\ServiceSubCategory;
use App\Models\User;
use Database\Seeders\PermissionAndRoleSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function seedUploadListingCategory(): array
{
    $category = ServiceCategory::query()->create([
        'id' => 'upload_housing',
        'name' => 'upload_housing',
        'label' => 'Housing',
        'slug' => 'upload-housing',
        'type' => 'housing',
        'sort_order' => 10,
        'is_active' => true,
        'is_public' => true,
    ]);

    $subCategory = ServiceSubCategory::query()->create([
        'id' => 'upload_housing_sale',
        'service_category_id' => $category->id,
        'name' => 'upload_housing_sale',
        'label' => 'Homes for sale',
        'slug' => 'upload-housing-sale',
        'type' => 'housing_sale',
        'transaction_type' => 'sale',
        'provider_kind' => 'user',
        'default_listing_table' => 'properties',
        'sort_order' => 10,
        'is_active' => true,
        'is_public' => true,
    ]);

    return [$category, $subCategory];
}

test('listing images are uploaded and stored from multipart forms', function () {
    Storage::fake('public');
    $this->seed(PermissionAndRoleSeeder::class);

    [$category, $subCategory] = seedUploadListingCategory();
    $user = User::factory()->create();
    $user->assignRole('provider');

    $this->actingAs($user)
        ->post('/properties', [
            'service_category_id' => $category->id,
            'service_sub_category_id' => $subCategory->id,
            'title' => 'Uploaded image listing',
            'description' => 'A listing with uploaded images.',
            'state' => 'Lagos',
            'city' => 'Lagos',
            'base_price' => 1200000,
            'currency' => 'NGN',
            'image_files' => [
                UploadedFile::fake()->image('cover.webp', 1200, 900),
            ],
        ])
        ->assertRedirect(route('post-listing'));

    $property = Property::query()->where('title', 'Uploaded image listing')->firstOrFail();
    $image = $property->images()->firstOrFail();

    Storage::disk('public')->assertExists($image->storage_path);

    expect($image)
        ->url->toContain('/storage/properties/')
        ->is_cover->toBeTrue()
        ->sort_order->toBe(0);
});
