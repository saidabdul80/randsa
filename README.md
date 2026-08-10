# RANDSA

RANDSA is an Ionic Vue rental and marketplace application. A registered user can browse,
save, book, pay for, and publish listings across properties, vehicles, event spaces,
services, fashion, electronics, land, horses, and other configured categories. Admin
authorization remains separate for moderation and platform management.

## Stack

- Ionic Vue and Vue 3 Composition API
- TypeScript and Vite
- Tailwind CSS
- Firebase Authentication, Firestore, Storage, Functions, Hosting, and Cloud Messaging
- Paystack backend-authoritative payments
- Leaflet and OpenStreetMap

## Implemented

- Email/password and Google authentication with profile completion
- Unified regular accounts; posting is not restricted by legacy landlord/agent roles
- Universal multi-step listing creation with category-specific fields
- Drafts, private listing documents, moderation, editing, and My Listings management
- Responsive marketplace cards, search, filters, saved listings, and recently viewed items
- Legacy property and universal listing details flows
- Adaptive booking modes and backend conflict checks
- Backend-created Paystack references, verification, and signed webhook processing
- In-app notifications, FCM token registration, push delivery, and scheduled reminders
- Admin moderation, user, booking, payment, and verification tools
- Ownership-focused Firestore and Storage rules with regression tests

## Local Setup

1. Install dependencies:

   ```powershell
   npm install
   npm --prefix functions install
   ```

2. Create `.env.local` from `.env.example` and provide the Firebase web configuration,
   VAPID key, and Paystack public key.

3. Start the app:

   ```powershell
   npm run dev
   ```

The current local development URL is normally `http://127.0.0.1:5174` when that port is
selected explicitly. Vite may choose another available port when started without one.

## Commands

```powershell
npm run dev
npm run lint
npm run format:check
npm run test
npm run build
npm run verify
npm run firebase:login
npm run firebase:login:list
npm run firebase:use
npm run rules:deploy
npm run hosting:deploy
```

`npm run verify` runs lint, all frontend/security/Functions tests, and the production build.

## Firebase Release Order

1. Confirm the selected Firebase project with `npm run firebase:login:list` and
   `npm run firebase:use` when needed.
2. Run `npm run verify`.
3. Deploy Firestore rules, indexes, and Storage rules with `npm run rules:deploy`.
4. Set `PAYSTACK_SECRET_KEY` and deploy Functions.
5. Deploy Hosting with `npm run hosting:deploy`.
6. Complete the live acceptance checks in [docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md).

## Documentation

- [Final deliverables](./FINAL_DELIVERABLES.md)
- [Release checklist](./docs/RELEASE_CHECKLIST.md)
- [Firebase setup](./docs/FIREBASE_SETUP.md)
- [Implementation guide](./docs/IMPLEMENTATION_GUIDE.md)
- [Booking schema](./docs/firebase-booking-schema.md)
- [Current handoff](./HANDOFF.md)
- [Phase checklist](./TASK_CHECKLIST.md)

## Current Release Status

The application code, Firestore/Storage rules, indexes, and all eight Gen 2 Cloud Functions
are deployed to `randsa-67e93`. Firebase Hosting was intentionally left unchanged. The following
checks remain pending until a Hosting release is approved:

- retry and confirm a universal listing publish after the latest Phase 12 rule deployment
- complete one Paystack test-mode transaction and verify its Firestore updates
- register an FCM browser token, run the reminder scan, and confirm `reminderSent == true`
- re-test admin moderation with live Firebase data
- complete a signed-in mobile and desktop visual smoke test

Do not commit `.env.local`, Firebase secrets, Paystack secrets, or generated browser profiles.
