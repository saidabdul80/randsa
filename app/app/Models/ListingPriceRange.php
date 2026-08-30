<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListingPriceRange extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'label',
        'currency',
        'min_amount',
        'max_amount',
        'sort_order',
        'is_active',
        'is_public',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
        ];
    }
}
