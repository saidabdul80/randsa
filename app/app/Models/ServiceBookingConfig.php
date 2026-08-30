<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceBookingConfig extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'service_sub_category_id',
        'is_bookable',
        'booking_mode',
        'title',
        'description',
        'primary_action_label',
        'date_label',
        'start_time_label',
        'end_date_label',
        'end_time_label',
        'summary_label',
        'payment_label',
        'reminder_title',
        'reminder_lead',
        'selection_kind',
        'default_duration_minutes',
        'minimum_duration_minutes',
        'buffer_minutes',
        'default_pricing_unit',
        'uses_agent_schedule',
        'prevents_duplicate_active_booking',
    ];

    protected function casts(): array
    {
        return [
            'is_bookable' => 'boolean',
            'default_duration_minutes' => 'integer',
            'minimum_duration_minutes' => 'integer',
            'buffer_minutes' => 'integer',
            'uses_agent_schedule' => 'boolean',
            'prevents_duplicate_active_booking' => 'boolean',
        ];
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ServiceSubCategory::class, 'service_sub_category_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'booking_config_id');
    }
}
