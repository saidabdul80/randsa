<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketplaceListingFieldValue extends Model
{
    protected $fillable = [
        'marketplace_listing_id',
        'service_field_id',
        'field_key',
        'value_string',
        'value_number',
        'value_boolean',
        'value_date',
        'value_json',
    ];

    protected function casts(): array
    {
        return [
            'value_number' => 'decimal:2',
            'value_boolean' => 'boolean',
            'value_date' => 'date',
            'value_json' => 'array',
        ];
    }

    public function listing(): BelongsTo
    {
        return $this->belongsTo(MarketplaceListing::class, 'marketplace_listing_id');
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(ServiceField::class, 'service_field_id');
    }
}
