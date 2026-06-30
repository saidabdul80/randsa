# Firebase Setup Guide

## 1. Required Products

Enable these Firebase products for RANDSA:

- Authentication
- Firestore Database
- Storage
- Cloud Functions
- Cloud Messaging

## 2. Authentication

Recommended providers currently used:

- Email/Password
- Google

The app also supports a local bypass mode for development only:

- `VITE_ENABLE_LOCAL_AUTH_BYPASS=true`

For real Firebase mode:

- set `VITE_ENABLE_LOCAL_AUTH_BYPASS=false`

## 3. Environment Variables

Create `.env.local` from `.env.example`.

Required app values:

```env
VITE_ENABLE_LOCAL_AUTH_BYPASS=false
VITE_ENABLE_LOCAL_PAYMENT_BYPASS=false
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
VITE_FIREBASE_FUNCTIONS_REGION=us-central1
VITE_FIREBASE_VAPID_KEY=your_web_push_vapid_key
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 4. Firebase CLI

Useful commands already reflected in `package.json`:

```bash
npm.cmd run firebase:login
npm.cmd run firebase:login:list
npm.cmd run firebase:use
npm.cmd run rules:deploy
```

If needed manually:

```bash
firebase login
firebase use --add
```

## 5. Firestore and Storage Deploy

Project config is in:

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`

Deploy them with:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 6. Functions Setup

Move into the functions directory:

```bash
cd functions
npm.cmd install
```

Set the Paystack secret:

```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY
```

Deploy functions:

```bash
firebase deploy --only functions
```

Current live payment callable:

- `verifyPaystackPayment`
- `createNotificationRecord`
- `runInspectionReminderScan`

Current scheduled backend job:

- `processInspectionReminders`

What it now checks before marking a payment successful:

- signed-in user must own the payment
- Firestore payment reference must match the Paystack reference
- Paystack amount must match the stored Firestore amount
- Paystack currency must be `NGN`
- Paystack customer email must match the stored payer email when present
- Paystack metadata `paymentId` must match when metadata is supplied

Recommended payment test flow:

1. Set `VITE_ENABLE_LOCAL_PAYMENT_BYPASS=false`
2. Set `VITE_PAYSTACK_PUBLIC_KEY` in `.env.local`
3. Restart the dev server
4. Create a pending payment from `/payment/:propertyId`
5. Open Paystack checkout
6. Complete the payment in Paystack test mode
7. Let the callable function verify the reference
8. Confirm the Firestore `payments/{paymentId}` document becomes:
   - `status: "success"`
   - `verificationMode: "backend_verified"`
   - `verifiedAt` populated

If verification fails, inspect:

- browser network call to the callable function
- Firebase Functions logs: `firebase functions:log`
- the `payments/{paymentId}` document in Firestore
- whether the `PAYSTACK_SECRET_KEY` secret and `VITE_PAYSTACK_PUBLIC_KEY` are both set correctly

## 7. Cloud Messaging Setup

Current notification pieces already in the repo:

- `src/lib/messaging.ts`
- `public/firebase-messaging-sw.js`
- callable notification creator in `functions/index.js`
- scheduled inspection reminder job in `functions/index.js`

You still need:

1. Web Push certificate key in Firebase Console
2. `VITE_FIREBASE_VAPID_KEY` in `.env.local`
3. live browser permission test
4. deploy functions after reminder-job changes: `firebase deploy --only functions`

Inspection reminder backend behavior now implemented:

- scheduled job runs every 60 minutes
- manual callable trigger is available for signed-in testing from the Notifications page
- reminders are generated for bookings within the next 24 hours
- each booking flips `reminderSent` to `true` after a reminder is created
- browser push is attempted when a saved FCM token exists; otherwise the reminder still lands in the in-app inbox

## 8. Storage Paths

Expected upload paths:

```text
users/{userId}/{fileName}
agent-verifications/{agentId}/{fileName}
properties/{ownerId}/{propertyId}/{fileName}
```

## 9. Important Production Notes

- Do not rely on frontend-only payment verification
- Do not abuse free OpenStreetMap tile servers at scale
- Re-test all rules after every auth or storage path change
- Re-deploy rules when `firestore.rules` or `storage.rules` changes
- Re-deploy indexes when `firestore.indexes.json` changes
