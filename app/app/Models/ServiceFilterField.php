<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceFilterField extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_category_id',
        'service_sub_category_id',
        'service_field_id',
        'filter_label',
        'filter_type',
        'operator',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceSubCategory::class, 'service_sub_category_id');
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(ServiceField::class, 'service_field_id');
    }
}
