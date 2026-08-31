<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceSubCategoryFormConfig extends Model
{
    protected $table = 'service_sub_category_form_config';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_sub_category_id',
        'form_title',
        'short_label',
        'description_prompts',
        'suggested_amenities',
        'image_guidance',
        'default_payment_duration',
        'default_currency',
        'default_country',
        'wizard_steps',
        'quality_rules',
    ];

    protected function casts(): array
    {
        return [
            'description_prompts' => 'array',
            'suggested_amenities' => 'array',
            'image_guidance' => 'array',
            'wizard_steps' => 'array',
            'quality_rules' => 'array',
        ];
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceSubCategory::class, 'service_sub_category_id');
    }
}
