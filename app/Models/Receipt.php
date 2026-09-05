<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Receipt extends Model
{
    protected $fillable = [
        'receipt_number',
        'owner_id',
        'user_id',
        'booking_id',
        'property_id',
        'marketplace_listing_id',
        'payment_id',
        'receipt_type',
        'status',
        'item_title',
        'issuer_name',
        'issuer_email',
        'issuer_phone',
        'customer_name',
        'customer_email',
        'customer_phone',
        'property_address',
        'line_items',
        'amount',
        'currency',
        'payment_method',
        'payment_reference',
        'period_start',
        'period_end',
        'paid_at',
        'issued_at',
        'sent_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'line_items' => 'array',
            'amount' => 'decimal:2',
            'period_start' => 'date',
            'period_end' => 'date',
            'paid_at' => 'datetime',
            'issued_at' => 'datetime',
            'sent_at' => 'datetime',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function marketplaceListing(): BelongsTo
    {
        return $this->belongsTo(MarketplaceListing::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
