<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'label',
        'description',
        'slug',
        'type',
        'icon_key',
        'keywords',
        'sort_order',
        'is_active',
        'is_public',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'is_public' => 'boolean',
        ];
    }

    public function subCategories(): HasMany
    {
        return $this->hasMany(ServiceSubCategory::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
