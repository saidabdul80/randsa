# RANDSA Implementation Guide

## Phase Summary

### Phase 1

Implemented:

- folder structure
- base routes
- empty pages
- bottom navigation
- responsive layout foundation

### Phase 2

Implemented:

- email/password auth
- Google sign-in
- Firestore profile creation
- signed-in profile completion path through `/register`
- local auth bypass mode for development

### Phase 3

Implemented:

- property creation and editing
- house vs shop field handling
- property image upload
- image compression
- image count limits
- status workflow

Deferred follow-up:

- full production storage cost optimization review

### Phase 4

Implemented:

- search
- filters
- sorting
- active filter chips

### Phase 5

Implemented:

- property details page
- image gallery
- map preview
- save property
- call and WhatsApp actions
- booking and payment entry points

### Phase 6

Implemented:

- agent verification submission flow
- admin review flow
- verification badge state
- verification document storage upload path

### Phase 7

Implemented:

- payment records
- backend-authoritative Paystack transaction initialization
- backend verification with amount, currency, email, and metadata checks
- signed Paystack success webhook
- atomic payment and booking status updates

Deferred follow-up:

- final Paystack test-mode checkout confirmation

### Phase 8

Implemented:

- booking creation
- payment status tie-in
- cancellation
- reminder-ready booking fields

### Phase 9

Implemented:

- notification inbox
- Firebase Messaging token registration
- callable notification creation
- browser push support wiring
- background push display and notification click routing
- hourly backend reminder jobs
- atomic reminder claiming and duplicate prevention
- automatic backend payment confirmations
- stale FCM token cleanup

Approval check:

- complete the final live browser/FCM validation pass on a registered device

### Phase 10

Implemented:

- Leaflet map preview
- OpenStreetMap integration
- responsive click-and-drag location picker support across property and universal listing flows
- validated latitude/longitude persistence with incomplete, non-finite, and out-of-range values rejected
- safe map popups that render listing text without HTML injection
- responsive map resizing for desktop and mobile layouts

Approval check:

- create or edit a listing, pin a location, save it, and confirm the same pin appears on its details page

### Phase 11

Implemented:

- Firestore-backed saved listings with local-mode fallback
- one-time migration of existing browser saves into Firestore
- source-aware saved identities for legacy properties and universal listings
- saved-page loading, error, and real summary states
- combined legacy and universal listing metrics on the admin dashboard
- moderation write locking across property, listing, and verification actions

Approval check:

- save one property and one universal listing, reload or sign in on another browser, then confirm both remain; approve or reject one queued listing as an admin and confirm its status updates

### Phase 12

Implemented:

- field-validated Firestore user, property, listing, verification, token, and saved-item writes
- immutable listing/property ownership with explicit owner and admin status transitions
- public reads limited to approved properties and active, approved marketplace listings
- backend-authoritative payment and booking creation preserved
- notification clients limited to marking records as read
- private listing documents restricted to their owner and admins
- Storage ownership, active-account, content-type, and 2 MB upload limits
- explicit deny fallback for unmatched Storage paths
- marketplace, owner, saved-item, and verification composite indexes
- repeatable Firebase security configuration regression tests

Approval check:

- as a regular user, save and edit an owned listing and confirm another user's pending or rejected listing is not readable; as an admin, approve one pending listing; upload one supported image and confirm an unsupported file is rejected

### Phase 13

Implemented:

- shared shell refresh
- premium cards and surfaces
- improved bottom nav
- polished home, listing, details, profile, and admin pages

Follow-up:

- responsive regression QA is complete; repeat the signed-in phone/desktop smoke test after final Hosting deployment

### Phase 14

Implemented:

- stronger route guards
- active-account checks on write-sensitive routes
- optional professional verification remains available to active unified accounts
- clearer admin-only handling
- same-app authentication redirect validation
- Firebase-mode admin user listing
- tighter rules for tokens, saved properties, payment creation, and notifications
- safer upload path and filename validation without cross-service owner lookups

### Phase 15

Implemented:

- README refresh
- final deliverables document
- Firebase setup guide
- implementation guide
- release checklist and current handoff
- explicit deferred-items and live-acceptance tracking

## Current Important Files

### App Shell and Navigation

- `src/components/layout/AppShell.vue`
- `src/components/navigation/AppBottomNav.vue`

### Auth

- `src/composables/useAuth.ts`
- `src/services/auth.ts`
- `src/router/index.ts`

### Property Flow

- `src/components/listing-form/ListingFormWizard.vue`
- `src/components/listing-form/MarketplaceListingWizard.vue`
- `src/components/property/PropertyForm.vue`
- `src/components/property/PropertyImageUploader.vue`
- `src/services/listings.ts`
- `src/services/properties.ts`
- `src/services/storageUploads.ts`
- `src/types/listing.ts`

### Payments

- `src/views/PaymentPage.vue`
- `src/services/payments.ts`
- `src/lib/paystack.ts`
- `functions/index.js`

### Notifications

- `src/services/notifications.ts`
- `src/composables/useNotifications.ts`
- `src/lib/messaging.ts`
- `public/firebase-messaging-sw.js`
- `functions/index.js`

### Maps

- `src/components/map/PropertyMapPreview.vue`
- `src/components/map/PropertyLocationPicker.vue`
- `src/lib/map.ts`

### Security

- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`

## Return-Later List

These should not be forgotten:

1. Deploy the staged Phase 14 Firestore and Storage rule changes
2. Retry and confirm universal listing publication after a hard refresh
3. Complete one real Paystack test-mode checkout and backend verification
4. Complete the final live FCM device/reminder confirmation
5. Re-test Firebase-mode admin moderation and user data
6. Repeat the signed-in phone/desktop smoke test after Hosting deployment
7. Add a dedicated provider view for bookings assigned to that provider
8. Optimize the main bundle and large hero images
