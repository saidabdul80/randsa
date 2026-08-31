<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPageSection extends Model
{
    protected $fillable = [
        'section_key',
        'placement',
        'eyebrow',
        'title',
        'description',
        'image_url',
        'action_label',
        'action_url',
        'payload',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
