<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\Property;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PropertySubmitted implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(public Property $property) {}

    public function notificationName(): string
    {
        return 'property.submitted';
    }

    public function notificationRecipients(): array
    {
        return array_values(array_filter([$this->property->owner()->first()]));
    }

    public function notificationContext(): array
    {
        return [
            'property_id' => $this->property->id,
            'owner_id' => $this->property->owner_id,
            'service_category_id' => $this->property->service_category_id,
            'service_sub_category_id' => $this->property->service_sub_category_id,
            'status' => $this->property->status,
        ];
    }
}
