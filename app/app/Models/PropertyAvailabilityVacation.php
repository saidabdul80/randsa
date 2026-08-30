<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyAvailabilityVacation extends Model
{
    protected $fillable = [
        'property_availability_agent_id',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function availabilityAgent(): BelongsTo
    {
        return $this->belongsTo(PropertyAvailabilityAgent::class, 'property_availability_agent_id');
    }
}
