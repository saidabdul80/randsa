<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\Booking;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingCancelled implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(public Booking $booking) {}

    public function notificationName(): string
    {
        return 'booking.cancelled';
    }

    public function notificationRecipients(): array
    {
        return array_values(array_filter([
            $this->booking->user()->first(),
            $this->booking->agent()->first(),
        ]));
    }

    public function notificationContext(): array
    {
        return [
            'booking_id' => $this->booking->id,
            'user_id' => $this->booking->user_id,
            'agent_id' => $this->booking->agent_id,
            'status' => $this->booking->status,
        ];
    }
}
