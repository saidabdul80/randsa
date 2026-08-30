<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'property_id',
        'marketplace_listing_id',
        'booking_id',
        'service_pricing_field_id',
        'agent_id',
        'item_title',
        'payer_name',
        'payer_email',
        'amount',
        'currency',
        'payment_type',
        'paystack_reference',
        'status',
        'verification_mode',
        'gateway',
        'gateway_authorization',
        'gateway_customer',
        'gateway_metadata',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'gateway_authorization' => 'array',
            'gateway_customer' => 'array',
            'gateway_metadata' => 'array',
            'verified_at' => 'datetime',
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

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function pricingField(): BelongsTo
    {
        return $this->belongsTo(ServicePricingField::class, 'service_pricing_field_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
