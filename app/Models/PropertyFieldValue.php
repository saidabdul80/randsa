<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyFieldValue extends Model
{
    protected $fillable = [
        'property_id',
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

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(ServiceField::class, 'service_field_id');
    }
}
