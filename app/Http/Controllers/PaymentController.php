<?php

namespace App\Http\Controllers;

use App\Events\PaymentCreated;
use App\Events\PaymentMarkedSuccessful;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function store(StorePaymentRequest $request): RedirectResponse
    {
        $this->authorize('create', Payment::class);

        $payment = Payment::query()->create(array_merge($request->validated(), [
            'user_id' => $request->user()->id,
            'currency' => $request->input('currency', 'NGN'),
            'paystack_reference' => 'RANDSA-'.now()->format('YmdHis').'-'.strtoupper(Str::random(8)),
            'status' => 'pending',
            'verification_mode' => 'backend_required',
            'gateway' => 'paystack',
        ]));

        PaymentCreated::dispatch($payment);

        $routeParameters = $payment->property_id
            ? ['property' => $payment->property_id]
            : ($payment->marketplace_listing_id ? ['listing' => $payment->marketplace_listing_id] : []);

        return redirect()
            ->route('payment', $routeParameters)
            ->with('status', 'payment-created');
    }

    public function show(Payment $payment): PaymentResource
    {
        $this->authorize('view', $payment);

        return new PaymentResource($payment->load(['booking', 'property', 'marketplaceListing']));
    }

    public function markSuccessful(Payment $payment): RedirectResponse
    {
        $this->authorize('markSuccessful', $payment);

        $payment->update([
            'status' => 'success',
            'verified_at' => now(),
        ]);

        $payment->booking?->update(['payment_status' => 'success']);

        PaymentMarkedSuccessful::dispatch($payment);

        return back()->with('status', 'payment-marked-successful');
    }
}
