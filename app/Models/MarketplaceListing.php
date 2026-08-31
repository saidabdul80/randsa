<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class MarketplaceListing extends Model
{
    protected $fillable = [
        'owner_id',
        'service_category_id',
        'service_sub_category_id',
        'title',
        'description',
        'status',
        'moderation_status',
        'country',
        'state',
        'city',
        'area',
        'address',
        'latitude',
        'longitude',
        'currency',
        'base_price',
        'maximum_amount',
        'price_type',
        'billing_period',
        'negotiable',
        'contact_name',
        'contact_phone',
        'whatsapp_enabled',
        'preferred_contact_method',
        'delivery_available',
        'pickup_available',
        'delivery_details',
        'view_count',
        'favourite_count',
        'published_at',
        'legacy_category',
        'legacy_sub_category',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'base_price' => 'decimal:2',
            'maximum_amount' => 'decimal:2',
            'negotiable' => 'boolean',
            'whatsapp_enabled' => 'boolean',
            'delivery_available' => 'boolean',
            'pickup_available' => 'boolean',
            'view_count' => 'integer',
            'favourite_count' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceSubCategory::class, 'service_sub_category_id');
    }

    public function fieldValues(): HasMany
    {
        return $this->hasMany(MarketplaceListingFieldValue::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(MarketplaceListingImage::class);
    }

    public function privateData(): HasOne
    {
        return $this->hasOne(ListingPrivateData::class, 'listing_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function savedItems(): HasMany
    {
        return $this->hasMany(SavedItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
