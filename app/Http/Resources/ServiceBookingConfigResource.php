<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceBookingConfigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'service_sub_category_id' => $this->service_sub_category_id,
            'is_bookable' => $this->is_bookable,
            'booking_mode' => $this->booking_mode,
            'title' => $this->title,
            'description' => $this->description,
            'primary_action_label' => $this->primary_action_label,
            'date_label' => $this->date_label,
            'start_time_label' => $this->start_time_label,
            'end_date_label' => $this->end_date_label,
            'end_time_label' => $this->end_time_label,
            'summary_label' => $this->summary_label,
            'payment_label' => $this->payment_label,
            'reminder_title' => $this->reminder_title,
            'reminder_lead' => $this->reminder_lead,
            'selection_kind' => $this->selection_kind,
            'default_duration_minutes' => $this->default_duration_minutes,
            'minimum_duration_minutes' => $this->minimum_duration_minutes,
            'buffer_minutes' => $this->buffer_minutes,
            'default_pricing_unit' => $this->default_pricing_unit,
            'uses_agent_schedule' => $this->uses_agent_schedule,
            'prevents_duplicate_active_booking' => $this->prevents_duplicate_active_booking,
        ];
    }
}
