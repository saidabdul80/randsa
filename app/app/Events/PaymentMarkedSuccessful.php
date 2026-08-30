<?php

namespace App\Events;

use App\Contracts\TriggersOutboundNotifications;
use App\Models\Payment;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentMarkedSuccessful implements ShouldDispatchAfterCommit, TriggersOutboundNotifications
{
    use Dispatchable, SerializesModels;

    public function __construct(public Payment $payment) {}

    public function notificationName(): string
    {
        return 'payment.marked-successful';
    }

    public function notificationRecipients(): array
    {
        return array_values(array_filter([
            $this->payment->user()->first(),
            $this->payment->agent()->first(),
        ]));
    }

    public function notificationContext(): array
    {
        return [
            'payment_id' => $this->payment->id,
            'user_id' => $this->payment->user_id,
            'agent_id' => $this->payment->agent_id,
            'booking_id' => $this->payment->booking_id,
            'amount' => $this->payment->amount,
            'currency' => $this->payment->currency,
            'status' => $this->payment->status,
        ];
    }
}
