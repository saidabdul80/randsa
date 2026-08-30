<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PropertyAvailabilityAgent extends Model
{
    protected $fillable = [
        'property_id',
        'agent_id',
        'working_days',
        'start_time',
        'end_time',
        'slot_interval_minutes',
        'duration_minutes',
        'maximum_bookings_per_day',
        'unavailable_dates',
    ];

    protected function casts(): array
    {
        return [
            'working_days' => 'array',
            'slot_interval_minutes' => 'integer',
            'duration_minutes' => 'integer',
            'maximum_bookings_per_day' => 'integer',
            'unavailable_dates' => 'array',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function vacations(): HasMany
    {
        return $this->hasMany(PropertyAvailabilityVacation::class);
    }
}
