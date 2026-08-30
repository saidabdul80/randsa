<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceField extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'key',
        'label',
        'management_label',
        'field_type',
        'data_type',
        'placeholder',
        'help_text',
        'default_value',
        'validation_rules',
        'is_system',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'default_value' => 'array',
            'validation_rules' => 'array',
            'is_system' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function options(): HasMany
    {
        return $this->hasMany(ServiceFieldOption::class);
    }

    public function subCategoryLinks(): HasMany
    {
        return $this->hasMany(ServiceSubCategoryField::class);
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
