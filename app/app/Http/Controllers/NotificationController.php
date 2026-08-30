<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotificationTokenRequest;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return NotificationResource::collection(
            Notification::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get(),
        );
    }

    public function storeToken(StoreNotificationTokenRequest $request): RedirectResponse
    {
        $request->user()->notificationTokens()->updateOrCreate(
            ['token' => $request->string('token')],
            ['device' => $request->input('device')],
        );

        return back()->with('status', 'notification-token-registered');
    }

    public function markRead(Notification $notification): RedirectResponse
    {
        $this->authorize('markRead', $notification);

        $notification->update(['read_at' => now()]);

        return back()->with('status', 'notification-read');
    }
}
