<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'property_id',
        'marketplace_listing_id',
        'service_category_id',
        'service_sub_category_id',
        'booking_config_id',
        'agent_id',
        'booking_mode',
        'inspection_date',
        'inspection_time',
        'start_at',
        'end_at',
        'duration_minutes',
        'quantity',
        'pricing_unit',
        'estimated_total',
        'category_details',
        'status',
        'payment_status',
        'reminder_sent',
        'guest_phone',
        'notes',
        'request_id',
        'schema_version',
    ];

    protected function casts(): array
    {
        return [
            'inspection_date' => 'datetime',
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'duration_minutes' => 'integer',
            'quantity' => 'integer',
            'estimated_total' => 'decimal:2',
            'category_details' => 'array',
            'reminder_sent' => 'boolean',
            'schema_version' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function marketplaceListing(): BelongsTo
    {
        return $this->belongsTo(MarketplaceListing::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceSubCategory::class, 'service_sub_category_id');
    }

    public function bookingConfig(): BelongsTo
    {
        return $this->belongsTo(ServiceBookingConfig::class, 'booking_config_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
