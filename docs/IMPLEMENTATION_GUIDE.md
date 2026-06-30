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
- Paystack checkout loader
- backend verification callable shape

Deferred follow-up:

- final live Paystack deployment and full end-to-end test

### Phase 8

Implemented:

- booking creation
- payment status tie-in
- cancellation
- reminder-ready booking fields

### Phase 9

Partially implemented:

- notification inbox
- Firebase Messaging token registration
- callable notification creation
- browser push support wiring

Deferred follow-up:

- scheduled backend reminder jobs
- final live FCM validation pass

### Phase 10

Implemented:

- Leaflet map preview
- OpenStreetMap integration
- location picker support
- lat/lng persistence

### Phase 11

Implemented:

- saved properties
- admin dashboard
- moderation panels

### Phase 12

Implemented:

- Firestore rules
- Storage rules
- Firestore indexes

### Phase 13

Implemented:

- shared shell refresh
- premium cards and surfaces
- improved bottom nav
- polished home, listing, details, profile, and admin pages

Follow-up:

- manual visual QA should still be completed on mobile and desktop

### Phase 14

Implemented:

- stronger route guards
- agent-only route access
- clearer admin-only handling
- Firebase-mode admin user listing
- tighter rules for tokens, saved properties, payment creation, and notifications
- safer upload path validation

### Phase 15

Implemented:

- README refresh
- final deliverables document
- Firebase setup guide
- implementation guide
- deferred-items tracking

## Current Important Files

### App Shell and Navigation

- `src/components/layout/AppShell.vue`
- `src/components/navigation/AppBottomNav.vue`

### Auth

- `src/composables/useAuth.ts`
- `src/services/auth.ts`
- `src/router/index.ts`

### Property Flow

- `src/components/property/PropertyForm.vue`
- `src/components/property/PropertyImageUploader.vue`
- `src/services/properties.ts`
- `src/services/storageUploads.ts`

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

1. Real Paystack deploy and test
2. Final FCM scheduled reminder backend work
3. Firebase-mode admin data re-test
4. Visual QA after the Phase 13 shell and page refresh
5. Bundle-size optimization pass
