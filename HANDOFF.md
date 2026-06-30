# RANDSA Handoff

Project: RANDSA

Stack:
- Ionic Vue
- Vue 3
- Tailwind CSS
- Firebase Authentication
- Firestore
- Firebase Storage
- Firebase Functions
- Firebase Cloud Messaging
- Paystack
- Leaflet + OpenStreetMap

## Current State

- Most core phases are implemented already.
- Live Firebase mode is now the main path.
- Local bypass still exists in code for fallback/testing, but `.env.local` was set to live mode.
- Admin dashboard, property upload, property moderation, agent verification, payments, bookings, notifications, and map are all present.
- Recent work focused on cleanup and stabilization rather than new scope.

## Where Work Stopped

- The Firebase Web Push VAPID key was added to `.env.local`.
- The next step was to restart the dev server and test `/notifications` again with:
  - `Enable push notifications`
  - manual backend reminder scan
- Backend reminder automation for Phase 9 was added, but still needs live deploy and test confirmation before being marked complete.

## Important Recent Changes

### 1. Firestore-backed properties

Files:
- `src/services/properties.ts`

Notes:
- Admin now sees shared pending properties from Firestore instead of browser-local only.

### 2. Firestore-backed agent verification

Files:
- `src/services/agentVerification.ts`

Notes:
- Admin verification queue is shared through Firestore.

### 3. Firestore-backed bookings

Files:
- `src/services/bookings.ts`
- `src/composables/useBookings.ts`
- `src/views/BookingPage.vue`
- `src/views/MyBookingsPage.vue`

Notes:
- Bookings now use Firestore in Firebase mode instead of local-only storage.

### 4. Local-to-Firestore migration tool

Files:
- `src/services/localDataMigration.ts`
- `src/components/profile/LocalDataMigrationCard.vue`
- `src/views/ProfilePage.vue`

Notes:
- Lets the signed-in owner or agent migrate older browser-only properties, bookings, and verification records into Firestore.

### 5. Google sign-in reliability improvements

Files:
- `src/services/auth.ts`
- `src/composables/useAuth.ts`
- `src/views/LoginPage.vue`
- `src/views/RegisterPage.vue`

Notes:
- Added popup timeout.
- Added popup-to-redirect fallback.
- Added flow-state tracking.
- Added clearer slow-network messaging.

### 6. Backend reminder automation

Files:
- `functions/index.js`
- `src/services/notifications.ts`
- `src/views/NotificationsPage.vue`

Notes:
- Added callable `runInspectionReminderScan`.
- Added scheduled `processInspectionReminders`.
- Added shared backend notification creation path.
- Notifications page now calls backend reminder scan instead of client-only scan.

### 7. Firestore indexes

File:
- `firestore.indexes.json`

Added:
- `bookings`: `userId + createdAt`
- `bookings`: `userId + reminderSent`

Existing indexes also cover payments and notifications queries.

### 8. Firestore rules

File:
- `firestore.rules`

Notes:
- Updated booking rule so a user can flip `reminderSent` from `false` to `true` on their own booking.

## Env and Config State

- `.env.local` was set to live Firebase mode:
  - `VITE_ENABLE_LOCAL_AUTH_BYPASS=false`
  - `VITE_ENABLE_LOCAL_PAYMENT_BYPASS=false`
- Firebase app config values were present.
- `VITE_FIREBASE_VAPID_KEY` was added.
- Paystack public key was already set.
- Firebase Functions secret `PAYSTACK_SECRET_KEY` had already been created earlier.

## What Is Still Undone

### 1. Phase 9 is not fully confirmed yet

Code is in place for notifications and backend reminder scans.

Still needs:
- `firebase deploy --only functions`
- `firebase deploy --only firestore:indexes`
- live browser test:
  - enable push notifications
  - create booking within next 24 hours
  - run backend reminder scan from `/notifications`
  - confirm inbox entry
  - confirm `bookings/{bookingId}.reminderSent == true`

### 2. `TASK_CHECKLIST.md` is behind reality

Checklist still shows these incomplete:
- Phase 2 auth items
- Phase 9 push reminders
- Phase 13 premium UI/UX visual confirmation
- Phase 14 security hardening redeploy/testing confirmation

Some items were intentionally left unchecked until live testing is confirmed.

### 3. Phase 13 still needs final visual confirmation pass

- UI is already much more polished.
- This is mostly review and confirmation, not a large missing code area.

### 4. Phase 14 still needs final confirmed redeploy and testing pass

- Especially after recent booking, rules, and index changes.

### 5. Deferred feature to remember later

- Agent booking view is not built yet.

Current behavior:
- tenant sees own bookings in `/my-bookings`
- admin sees all bookings in `/admin`
- agent does not yet have a dedicated "tenant bookings assigned to me" view

This was explicitly deferred for later, not now.

## Known Issue

Last known verification state:
- `vue-tsc -b` passed
- `node -c functions/index.js` passed

But direct Vite build hit an existing build-tool issue:
- absolute `D:/RANDSA/index.html` emitted in build-html
- looked like a Vite or Rolldown issue, not caused by the reminder code itself

If build fails again, inspect `vite build` specifically.

## Recommended Next Steps

1. Open the project and confirm `.env.local` exists with live Firebase mode and VAPID key.
2. Run the dev server.
3. Deploy the latest backend and index changes:
   - `firebase deploy --only functions`
   - `firebase deploy --only firestore:indexes`
   - if rules changed locally too: `firebase deploy --only firestore:rules`
4. Test `/notifications`:
   - enable push notifications
   - confirm token saved under `users/{userId}/tokens/{tokenId}`
5. Test reminder flow:
   - create a booking within the next 24 hours
   - run backend reminder scan from `/notifications`
   - confirm notification document appears
   - confirm booking `reminderSent` becomes `true`
6. If that works, update `TASK_CHECKLIST.md` for Phase 9 only after real confirmation.
7. Then continue with:
   - Phase 13 visual confirmation pass
   - Phase 14 final security and rules confirmation pass

## Useful Routes To Test

- `/login`
- `/register`
- `/profile`
- `/admin`
- `/add-property`
- `/payment/:propertyId`
- `/booking/:propertyId`
- `/my-bookings`
- `/notifications`

## Important Reminder

- Do not start the deferred agent-booking feature yet unless explicitly requested.
- Stay with the original plan first:
  - finish Phase 9 confirmation
  - then Phase 13
  - then Phase 14
