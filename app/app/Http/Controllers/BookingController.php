<?php

namespace App\Http\Controllers;

use App\Events\BookingCancelled;
use App\Events\BookingCreated;
use App\Http\Requests\StoreBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $this->authorize('create', Booking::class);

        $booking = Booking::query()->create(array_merge($request->validated(), [
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'payment_status' => 'pending',
            'request_id' => 'booking-'.Str::uuid(),
            'schema_version' => 3,
        ]));

        BookingCreated::dispatch($booking);

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
