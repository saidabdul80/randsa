# RANDSA Final Deliverables

## Product Delivered

RANDSA is now a unified rental and marketplace application rather than a property-only
platform. Every active registered account can publish listings. Legacy roles remain
readable for migration compatibility, but they do not control posting access. The admin
role remains privileged and is never selectable during registration.

## Application Structure

```text
RANDSA/
|-- src/
|   |-- components/
|   |   |-- auth/
|   |   |-- booking/
|   |   |-- layout/
|   |   |-- listing-form/
|   |   |-- map/
|   |   |-- navigation/
|   |   |-- notifications/
|   |   |-- profile/
|   |   `-- property/
|   |-- composables/
|   |-- config/
|   |-- data/
|   |-- lib/
|   |-- router/
|   |-- services/
|   |-- types/
|   |-- utils/
|   `-- views/
|-- functions/
|   |-- index.js
|   |-- booking-engine.js
|   |-- notification-engine.js
|   |-- payment-engine.js
|   `-- test/
|-- public/firebase-messaging-sw.js
|-- docs/
|-- firestore.rules
|-- firestore.indexes.json
|-- storage.rules
|-- firebase.json
`-- package.json
```

## Major User Flows

### Authentication and Accounts

- Email/password and Google authentication
- Popup-to-redirect fallback for Google sign-in
- Safe internal return-path validation
- Firestore profile completion
- Active, suspended, and disabled account handling
- Unified account access for posting
- Optional professional verification
- Admin-only moderation routes and data access

### Marketplace Listings

- Category and subcategory selection
- Reusable six-step listing wizard
- Dynamic category-specific fields
- Draft save and restore
- Public media and private PDF handling
- Owner editing, deletion, and status management
- Admin approval and rejection
- Responsive marketplace discovery cards
- Search, category, price, availability, and category-specific filters
- Saved listings, comparison, quick view, and recently viewed history

### Booking and Payments

- Adaptive booking modes for inspection, overnight, hourly, daily, service, and purchase flows
- Backend booking availability and conflict checks
- Backend-authoritative booking creation
- Booking cancellation and reminder fields
- Backend-created Paystack references
- Amount, currency, email, metadata, and ownership verification
- Signed Paystack webhook handling
- Atomic payment and related booking updates

### Notifications

- In-app notification inbox
- FCM browser token registration
- Foreground and service-worker notification handling
- Backend notification creation
- Hourly inspection reminder schedule
- Manual reminder scan for live verification
- Duplicate prevention and stale-token cleanup

### Administration

- Property and universal listing moderation
- Verification review
- Firebase-mode user listing
- Booking and payment visibility
- Notification and activity summaries
- Account role/status controls protected by Firestore rules

## Main Routes

```text
/home
/login
/register
/post-listing
/edit-listing/:listingId
/my-listings
/listings/:listingId
/properties/:propertyId
/saved-properties
/booking/:propertyId?
/my-bookings
/payment/:propertyId?
/notifications
/agent-verification
/profile
/admin
```

`/add-property` remains an alias for `/post-listing`, and `/properties` redirects to the
marketplace section on Home.

## Firebase Data Model

### Core collections

- `users/{userId}`: profile, admin-compatible legacy role, verification, and account status
- `users/{userId}/tokens/{tokenId}`: FCM token, device label, and creation timestamp
- `listings/{listingId}`: universal public/moderation listing data
- `listingPrivate/{listingId}`: owner-only private document URL and metadata
- `properties/{propertyId}`: legacy property records kept for compatibility
- `savedProperties/{savedId}`: source-aware saved property or universal listing identity
- `bookings/{bookingId}`: booking mode, schedule, status, payment status, and reminder state
- `payments/{paymentId}`: backend reference, amount, type, status, and verification metadata
- `notifications/{notificationId}`: inbox and delivery metadata
- `agentVerifications/{verificationId}`: optional professional verification submission

### Storage paths

```text
users/{userId}/{fileName}
agent-verifications/{userId}/{fileName}
properties/{ownerId}/{propertyId}/{fileName}
listings/{ownerId}/{listingId}/{fileName}
listing-private/{ownerId}/{listingId}/{fileName}
```

Uploads are restricted by ownership, supported content type, a 2 MB size limit, and safe
file names. Public reads are limited to approved/active listing media. The universal
listing owner upload path intentionally avoids a Firestore profile lookup so authenticated
owner uploads remain reliable; the final Firestore listing write still requires an active
account.

## Cloud Functions

Implemented exports in `functions/index.js`:

- `getBookingAvailability`
- `createUniversalBooking`
- `initializePaystackPayment`
- `verifyPaystackPayment`
- `paystackWebhook`
- `createNotificationRecord`
- `runInspectionReminderScan`
- `processInspectionReminders`

The Paystack secret must exist as the Firebase Functions secret `PAYSTACK_SECRET_KEY`.

## Security Delivered

- Public reads only for approved legacy properties and active/approved universal listings
- Owner-only private listing data
- Immutable listing ownership
- Explicit owner/admin moderation transitions
- Backend-only payment and booking creation
- User notification edits limited to setting `readAt`
- Source-aware saved-item ownership
- Admin-only user listing and moderation
- Active-account guards on write-sensitive routes
- Safe same-app authentication redirects
- Explicit Storage deny fallback
- Static regression tests for rules and indexes

## Verification Commands

```powershell
npm run lint
npm run format:check
npm run test
npm run build
```

The final Phase 15 verification should report zero lint errors. Existing warnings, if any,
must be listed rather than hidden. Vite currently reports a large main-chunk warning; this
is a performance follow-up and does not fail the production build.

## Deployment State

- Firebase project configured in `.firebaserc`: `randsa-67e93`
- Git remote configured: `https://github.com/Mohd633284/RANDSA.git`
- Final Firestore rules, indexes, and Storage rules were deployed on 10 August 2026
- All eight expected Gen 2 Cloud Functions are active in `us-central1`
- Final release commit `f8ac5a9` is available on `origin/main`
- Firebase Hosting was intentionally excluded and live acceptance remains pending

## Required Live Acceptance

Automated tests cannot replace these real-service checks:

1. Publish a universal listing with images and confirm the Firestore document is pending review.
2. Approve it as admin and confirm it becomes publicly readable.
3. Complete one Paystack test payment and confirm payment and booking updates.
4. Register push notifications, create a booking within 24 hours, run the reminder scan,
   confirm the notification document, and confirm `reminderSent == true`.
5. Confirm saved listings persist across a second browser session.
6. Smoke-test Home, Post Listing, My Listings, details, bookings, notifications, profile,
   and admin on phone and desktop.

The exact release procedure is in [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md).
