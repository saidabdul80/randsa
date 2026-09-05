<?php

namespace App\Http\Controllers;

use App\Actions\CreateCustomerAccount;
use App\Events\BookingCancelled;
use App\Events\BookingCreated;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request, CreateCustomerAccount $createCustomer): RedirectResponse
    {
        if ($request->user()) {
            $this->authorize('create', Booking::class);
        }

        $validated = $request->validated();
        $user = $request->user() ?: $createCustomer->execute(
            (string) $validated['customer_name'],
            (string) $validated['customer_email'],
            (string) $validated['customer_phone'],
        );

        if (! $request->user()) {
            Auth::login($user, remember: true);
            $request->session()->regenerate();
        }

        $booking = Booking::query()->create(array_merge(Arr::except($validated, ['redirect_to']), [
            'user_id' => $user->id,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => $validated['customer_phone'] ?? $user->phone,
            'status' => 'pending',
            'payment_status' => 'pending',
            'request_id' => 'booking-'.Str::uuid(),
            'schema_version' => 3,
        ]));

        BookingCreated::dispatch($booking);

        if (($validated['redirect_to'] ?? null) === 'back') {
            return back()->with('status', 'booking-created');
        }

        return redirect()->route('my-bookings', ['selected' => $booking->id])->with('status', 'booking-created');
    }

    public function show(Booking $booking): BookingResource
    {
        $this->authorize('view', $booking);

        return new BookingResource($booking->load(['property', 'marketplaceListing', 'agent', 'payments']));
    }

    public function cancel(Booking $booking): RedirectResponse
    {
        $this->authorize('cancel', $booking);

        $booking->update(['status' => 'cancelled']);

        BookingCancelled::dispatch($booking);

        return back()->with('status', 'booking-cancelled');
    }
}
