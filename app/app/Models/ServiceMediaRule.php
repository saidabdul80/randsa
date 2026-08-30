<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceMediaRule extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_sub_category_id',
        'requires_images',
        'min_images',
        'max_images',
        'allows_video',
        'allowed_video_providers',
        'allows_private_document',
        'private_document_label',
        'private_document_required',
        'allowed_file_types',
        'max_file_size_mb',
    ];

    protected function casts(): array
    {
        return [
            'requires_images' => 'boolean',
            'min_images' => 'integer',
            'max_images' => 'integer',
            'allows_video' => 'boolean',
            'allowed_video_providers' => 'array',
            'allows_private_document' => 'boolean',
            'private_document_required' => 'boolean',
            'allowed_file_types' => 'array',
            'max_file_size_mb' => 'integer',
        ];
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceSubCategory::class, 'service_sub_category_id');
    }
}
