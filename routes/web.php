<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\LandingPageSectionController;
use App\Http\Controllers\Admin\ListingPriceRangeController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\ServiceCategoryController;
use App\Http\Controllers\Admin\ServiceFieldController;
use App\Http\Controllers\Admin\ServiceSubCategoryController;
use App\Http\Controllers\AgentVerificationController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\MarketplaceListingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\SavedItemController;
use App\Http\Controllers\Web\PageController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/marketplace-results', [PageController::class, 'marketplaceResults'])->name('marketplace-results');
Route::redirect('/home', '/')->name('home.legacy');
Route::redirect('/dashboard', '/')->name('dashboard');

Route::middleware('guest')->group(function (): void {
    Route::get('/onboarding', [PageController::class, 'onboarding'])->name('onboarding');
    Route::get('/login', [PageController::class, 'login'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
    Route::get('/register', [PageController::class, 'register'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])->name('register.store');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
});

Route::get('/properties', [PageController::class, 'properties'])->name('properties');
Route::get('/properties/{property}', [PageController::class, 'propertyDetails'])->name('property-details');
Route::get('/listings/{marketplaceListing}', [PageController::class, 'listingDetails'])->name('marketplace-listing-details');

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('/post-listing', [PageController::class, 'postListing'])->name('post-listing');
    Route::get('/add-property', [PageController::class, 'postListing'])->name('add-property');
    Route::get('/edit-listing/{marketplaceListing}', [PageController::class, 'editListing'])->name('edit-listing');
    Route::get('/edit-property/{property}', [PageController::class, 'editProperty'])->name('edit-property');
    Route::get('/my-listings', [PageController::class, 'myListings'])->name('my-listings');
    Route::get('/saved-properties', [PageController::class, 'savedProperties'])->name('saved-properties');
    Route::get('/booking/{property?}', [PageController::class, 'booking'])->name('booking');
    Route::get('/my-bookings', [PageController::class, 'myBookings'])->name('my-bookings');
    Route::get('/payment/{property?}', [PageController::class, 'payment'])->name('payment');
    Route::get('/agent-verification', [PageController::class, 'agentVerification'])->name('agent-verification');
    Route::get('/notifications', [PageController::class, 'notifications'])->name('notifications');

    Route::post('/properties', [PropertyController::class, 'store'])
        ->middleware('can:properties.create')
        ->name('properties.store');
    Route::get('/property-records/{property}', [PropertyController::class, 'show'])->name('properties.show-record');
    Route::patch('/properties/{property}', [PropertyController::class, 'update'])->name('properties.update');
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy'])->name('properties.destroy');

    Route::post('/listings', [MarketplaceListingController::class, 'store'])
        ->middleware('can:marketplace-listings.create')
        ->name('listings.store');
    Route::get('/listing-records/{marketplaceListing}', [MarketplaceListingController::class, 'show'])->name('listings.show-record');
    Route::patch('/listings/{marketplaceListing}', [MarketplaceListingController::class, 'update'])->name('listings.update');
    Route::delete('/listings/{marketplaceListing}', [MarketplaceListingController::class, 'destroy'])->name('listings.destroy');

    Route::post('/bookings', [BookingController::class, 'store'])
        ->middleware('can:bookings.create')
        ->name('bookings.store');
    Route::get('/booking-records/{booking}', [BookingController::class, 'show'])->name('bookings.show-record');
    Route::patch('/bookings/{booking}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');

    Route::post('/payments', [PaymentController::class, 'store'])
        ->middleware('can:payments.create')
        ->name('payments.store');
    Route::get('/payment-records/{payment}', [PaymentController::class, 'show'])->name('payments.show-record');
    Route::patch('/payments/{payment}/mark-successful', [PaymentController::class, 'markSuccessful'])
        ->middleware('can:payments.manage')
        ->name('payments.mark-successful');

    Route::get('/saved-items', [SavedItemController::class, 'index'])->name('saved-items.index');
    Route::post('/saved-items', [SavedItemController::class, 'store'])->name('saved-items.store');
    Route::delete('/saved-items/{savedItem}', [SavedItemController::class, 'destroy'])->name('saved-items.destroy');

    Route::get('/notification-records', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notification-tokens', [NotificationController::class, 'storeToken'])->name('notification-tokens.store');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');

    Route::get('/agent-verification-records', [AgentVerificationController::class, 'index'])->name('agent-verifications.index');
    Route::post('/agent-verifications', [AgentVerificationController::class, 'store'])
        ->middleware('can:agent-verifications.submit')
        ->name('agent-verifications.store');
});

Route::middleware(['auth', 'can:admin.access'])->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/', [AdminDashboardController::class, 'overview'])->name('dashboard');
    Route::get('/services', [AdminDashboardController::class, 'services'])->name('services');
    Route::get('/site', [AdminDashboardController::class, 'site'])->name('site');
    Route::get('/permissions', [AdminDashboardController::class, 'permissions'])->name('permissions');
    Route::get('/review-queues', [AdminDashboardController::class, 'queues'])->name('queues');

    Route::resource('service-categories', ServiceCategoryController::class)
        ->middleware('can:service-categories.manage')
        ->except(['create', 'edit'])
        ->parameters(['service-categories' => 'serviceCategory']);

    Route::resource('service-sub-categories', ServiceSubCategoryController::class)
        ->middleware('can:service-categories.manage')
        ->except(['create', 'edit'])
        ->parameters(['service-sub-categories' => 'serviceSubCategory']);

    Route::resource('service-fields', ServiceFieldController::class)
        ->middleware('can:service-fields.manage')
        ->except(['create', 'edit'])
        ->parameters(['service-fields' => 'serviceField']);

    Route::resource('listing-price-ranges', ListingPriceRangeController::class)
        ->except(['create', 'edit'])
        ->parameters(['listing-price-ranges' => 'listingPriceRange']);

    Route::resource('landing-page-sections', LandingPageSectionController::class)
        ->except(['create', 'edit'])
        ->parameters(['landing-page-sections' => 'landingPageSection']);

    Route::patch('/roles/{role}/permissions', [RolePermissionController::class, 'update'])
        ->middleware('can:roles.manage')
        ->name('roles.permissions.update');
    Route::post('/roles', [RolePermissionController::class, 'store'])
        ->middleware('can:roles.manage')
        ->name('roles.store');

    Route::patch('/properties/{property}/review', [ModerationController::class, 'reviewProperty'])
        ->middleware('can:properties.moderate')
        ->name('properties.review');
    Route::patch('/listings/{marketplaceListing}/review', [ModerationController::class, 'reviewMarketplaceListing'])
        ->middleware('can:marketplace-listings.moderate')
        ->name('listings.review');
    Route::patch('/agent-verifications/{agentVerification}/review', [ModerationController::class, 'reviewAgentVerification'])
        ->middleware('can:agent-verifications.review')
        ->name('agent-verifications.review');
});

Route::fallback(fn () => inertia('NotFoundPage'))->name('not-found');
