<?php

namespace App\Providers;

use App\Events\AgentVerificationReviewed;
use App\Events\AgentVerificationSubmitted;
use App\Events\BookingCancelled;
use App\Events\BookingCreated;
use App\Events\MarketplaceListingReviewed;
use App\Events\MarketplaceListingSubmitted;
use App\Events\PaymentCreated;
use App\Events\PaymentMarkedSuccessful;
use App\Events\PropertyReviewed;
use App\Events\PropertySubmitted;
use App\Events\UserRegistered;
use App\Listeners\SendDomainEventEmail;
use App\Listeners\SendDomainEventSms;
use App\Models\AgentVerification;
use App\Models\Booking;
use App\Models\MarketplaceListing;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Property;
use App\Models\SavedItem;
use App\Policies\AgentVerificationPolicy;
use App\Policies\BookingPolicy;
use App\Policies\MarketplaceListingPolicy;
use App\Policies\NotificationPolicy;
use App\Policies\PaymentPolicy;
use App\Policies\PropertyPolicy;
use App\Policies\SavedItemPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
        $this->registerDomainEventListeners();
        $this->configureDefaults();
    }

    /**
     * Register model policies used by permission-driven route/controller checks.
     */
    protected function registerPolicies(): void
    {
        Gate::policy(AgentVerification::class, AgentVerificationPolicy::class);
        Gate::policy(Booking::class, BookingPolicy::class);
        Gate::policy(MarketplaceListing::class, MarketplaceListingPolicy::class);
        Gate::policy(Notification::class, NotificationPolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Property::class, PropertyPolicy::class);
        Gate::policy(SavedItem::class, SavedItemPolicy::class);
    }

    /**
     * Register domain events that can fan out to email, SMS, and future channels.
     */
    protected function registerDomainEventListeners(): void
    {
        foreach ($this->outboundNotificationEvents() as $event) {
            Event::listen($event, SendDomainEventEmail::class);
            Event::listen($event, SendDomainEventSms::class);
        }
    }

    /**
     * @return array<int, class-string>
     */
    protected function outboundNotificationEvents(): array
    {
        return [
            UserRegistered::class,
            PropertySubmitted::class,
            PropertyReviewed::class,
            MarketplaceListingSubmitted::class,
            MarketplaceListingReviewed::class,
            BookingCreated::class,
            BookingCancelled::class,
            PaymentCreated::class,
            PaymentMarkedSuccessful::class,
            AgentVerificationSubmitted::class,
            AgentVerificationReviewed::class,
        ];
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
