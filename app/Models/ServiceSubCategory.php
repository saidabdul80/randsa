<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceSubCategory extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_category_id',
        'name',
        'label',
        'description',
        'slug',
        'keywords',
        'type',
        'transaction_type',
        'provider_kind',
        'fulfillment_mode',
        'default_listing_table',
        'default_status',
        'requires_moderation',
        'requires_provider_verification',
        'uses_service_area',
        'is_bookable',
        'is_payable',
        'allows_private_document',
        'sort_order',
        'is_active',
        'is_public',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'requires_moderation' => 'boolean',
            'requires_provider_verification' => 'boolean',
            'uses_service_area' => 'boolean',
            'is_bookable' => 'boolean',
            'is_payable' => 'boolean',
            'allows_private_document' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function fieldLinks(): HasMany
    {
        return $this->hasMany(ServiceSubCategoryField::class);
    }

    public function formConfig(): HasOne
    {
        return $this->hasOne(ServiceSubCategoryFormConfig::class);
    }

    public function pricingFields(): HasMany
    {
        return $this->hasMany(ServicePricingField::class);
    }

    public function mediaRule(): HasOne
    {
        return $this->hasOne(ServiceMediaRule::class);
    }

    public function bookingConfig(): HasOne
    {
        return $this->hasOne(ServiceBookingConfig::class);
    }

    public function displayFields(): HasMany
    {
        return $this->hasMany(ServiceDisplayField::class);
    }

    public function filterFields(): HasMany
    {
        return $this->hasMany(ServiceFilterField::class);
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function marketplaceListings(): HasMany
    {
        return $this->hasMany(MarketplaceListing::class);
    }
}
