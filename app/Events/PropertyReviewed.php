<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\Property;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PropertyReviewed implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Property $property,
        public ?string $previousStatus = null,
    ) {}

    public function notificationName(): string
    {
        return 'property.reviewed';
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
            'previous_status' => $this->previousStatus,
            'status' => $this->property->status,
        ];
    }
}
