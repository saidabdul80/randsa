<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceSubCategoryField extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_sub_category_id',
        'service_field_id',
        'field_group',
        'section_label',
        'is_required',
        'is_filterable',
        'is_searchable',
        'is_displayed_on_card',
        'is_displayed_on_details',
        'sort_order',
        'min_value',
        'max_value',
        'min_length',
        'max_length',
        'visibility_condition',
        'clearing_group',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'is_filterable' => 'boolean',
            'is_searchable' => 'boolean',
            'is_displayed_on_card' => 'boolean',
            'is_displayed_on_details' => 'boolean',
            'sort_order' => 'integer',
            'min_value' => 'decimal:2',
            'max_value' => 'decimal:2',
            'min_length' => 'integer',
            'max_length' => 'integer',
            'visibility_condition' => 'array',
        ];
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
