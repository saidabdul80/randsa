<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Property extends Model
{
    protected $fillable = [
        'owner_id',
        'service_category_id',
        'service_sub_category_id',
        'title',
        'description',
        'state',
        'city',
        'area',
        'address',
        'latitude',
        'longitude',
        'owner_phone',
        'status',
        'is_available',
        'base_price',
        'currency',
        'pricing_unit',
        'limited_remaining_capacity',
        'blocked_dates',
        'buffer_minutes',
        'minimum_duration_minutes',
        'legacy_category',
        'legacy_property_type',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'is_available' => 'boolean',
            'base_price' => 'decimal:2',
            'limited_remaining_capacity' => 'integer',
            'blocked_dates' => 'array',
            'buffer_minutes' => 'integer',
            'minimum_duration_minutes' => 'integer',
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
        return $this->hasMany(PropertyFieldValue::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class);
    }

    public function availabilityAgents(): HasMany
    {
        return $this->hasMany(PropertyAvailabilityAgent::class);
    }

    public function availabilityVacations(): HasManyThrough
    {
        return $this->hasManyThrough(PropertyAvailabilityVacation::class, PropertyAvailabilityAgent::class);
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
