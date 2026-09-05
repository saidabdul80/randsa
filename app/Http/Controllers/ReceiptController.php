<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReceiptRequest;
use App\Http\Resources\ReceiptResource;
use App\Mail\ReceiptIssuedMail;
use App\Models\Booking;
use App\Models\Receipt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ReceiptController extends Controller
{
    public function store(StoreReceiptRequest $request): RedirectResponse
    {
        $booking = $request->receiptBooking();
        $owner = $request->user();
        $validated = $request->validated();
        $itemTitle = $validated['item_description'] ?? $this->bookingItemTitle($booking);

        $receipt = DB::transaction(function () use ($booking, $itemTitle, $owner, $validated): Receipt {
            $receipt = Receipt::query()->create([
                'receipt_number' => $this->receiptNumber(),
                'owner_id' => $owner->id,
                'user_id' => $booking->user_id,
                'booking_id' => $booking->id,
                'property_id' => $booking->property_id,
                'marketplace_listing_id' => $booking->marketplace_listing_id,
                'receipt_type' => $validated['receipt_type'],
                'status' => 'issued',
                'item_title' => $itemTitle,
                'issuer_name' => $owner->name,
                'issuer_email' => $owner->email,
                'issuer_phone' => $owner->phone,
                'customer_name' => $booking->customer_name ?: $booking->user->name,
                'customer_email' => $booking->customer_email ?: $booking->user->email,
                'customer_phone' => $booking->customer_phone ?: $booking->user->phone,
                'property_address' => $this->bookingAddress($booking),
                'line_items' => [
                    [
                        'description' => $itemTitle,
                        'amount' => $validated['amount'],
                        'currency' => $validated['currency'] ?? 'NGN',
                    ],
                ],
                'amount' => $validated['amount'],
                'currency' => $validated['currency'] ?? 'NGN',
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $validated['payment_reference'] ?? null,
                'period_start' => $validated['period_start'] ?? null,
                'period_end' => $validated['period_end'] ?? null,
                'paid_at' => $validated['paid_at'],
                'issued_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);

            $booking->update([
                'payment_status' => 'paid',
                'status' => $booking->status === 'pending' ? 'confirmed' : $booking->status,
            ]);

            return $receipt;
        });

        if ($request->boolean('send_email', true)) {
            Mail::to($receipt->customer_email)->send(new ReceiptIssuedMail($receipt));
            $receipt->update(['sent_at' => now()]);
        }

        return back()->with('status', 'receipt-issued');
    }

    public function show(Receipt $receipt): ReceiptResource
    {
        $this->authorize('view', $receipt);

        return new ReceiptResource(
            $receipt->load(['owner', 'user', 'booking', 'property.images', 'marketplaceListing.images']),
        );
    }

    private function receiptNumber(): string
    {
        do {
            $number = 'RCT-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        } while (Receipt::query()->where('receipt_number', $number)->exists());

        return $number;
    }

    private function bookingItemTitle(Booking $booking): string
    {
        return $booking->property?->title
            ?: $booking->marketplaceListing?->title
            ?: 'Booking #'.$booking->id;
    }

    private function bookingAddress(Booking $booking): ?string
    {
        $item = $booking->property ?: $booking->marketplaceListing;

        if (! $item) {
            return null;
        }

        return collect([
            $item->address,
            $item->area,
            $item->city,
            $item->state,
        ])->filter()->join(', ');
    }
}
