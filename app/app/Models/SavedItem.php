<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedItem extends Model
{
    protected $fillable = [
        'user_id',
        'item_type',
        'property_id',
        'marketplace_listing_id',
    ];

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
}
