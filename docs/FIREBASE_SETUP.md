# RANDSA Firebase Setup

## Required Firebase Products

Enable the following in the Firebase project:

- Authentication
- Firestore Database
- Storage
- Cloud Functions
- Cloud Messaging
- Hosting

The configured project in this repository is `randsa-67e93`.

## Authentication

Enable:

- Email/Password
- Google

Add local and deployed Hosting domains to Firebase Authentication authorized domains.

Local bypass is development-only:

```env
VITE_ENABLE_LOCAL_AUTH_BYPASS=false
VITE_ENABLE_LOCAL_PAYMENT_BYPASS=false
```

Production and live Firebase testing must keep both values `false`.

## Environment Variables

Create `.env.local` from `.env.example`:

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

Never commit `.env.local` or the Paystack secret key.

## CLI and Dependencies

```powershell
npm install
npm --prefix functions install
npm run firebase:login
npm run firebase:login:list
npm run firebase:use
```

Confirm the active Firebase project before every deployment.

## Local Verification

```powershell
npm run verify
```

Individual suites:

```powershell
npm run lint
npm run format:check
npm run test:marketplace
npm run test:routes
npm run test:security
npm run test:functions
npm run build
```

## Rules and Indexes

Configuration files:

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `firebase.json`

Deploy Phase 14 rules and indexes:

```powershell
npm run rules:deploy
```

This resolves to the pinned Firebase CLI and deploys the Firestore and Storage targets.

## Cloud Functions

Set the backend Paystack secret:

```powershell
npx firebase-tools@13.35.1 functions:secrets:set PAYSTACK_SECRET_KEY
```

Deploy Functions:

```powershell
npx firebase-tools@13.35.1 deploy --only functions
```

Implemented exports:

- `getBookingAvailability`
- `createUniversalBooking`
- `initializePaystackPayment`
- `verifyPaystackPayment`
- `paystackWebhook`
- `createNotificationRecord`
- `runInspectionReminderScan`
- `processInspectionReminders`

Configure the deployed `paystackWebhook` HTTPS URL in the Paystack dashboard. Only signed
`charge.success` events are accepted.

## Paystack Acceptance Test

1. Keep payment bypass disabled.
2. Create a payment from RANDSA.
3. Open the backend-provided Paystack checkout URL.
4. Complete a Paystack test-mode payment.
5. Return to RANDSA and allow backend verification.
6. Confirm `payments/{paymentId}` has:
   - `status: "success"`
   - `verificationMode: "backend_verified"`
   - `verifiedAt` populated
7. Confirm the related booking payment state updates when applicable.

If it fails, inspect `firebase functions:log`, the payment document, secret configuration,
amount/currency, payer email, and Paystack metadata.

## Cloud Messaging Acceptance Test

1. Create a Web Push certificate in Firebase Console.
2. Set `VITE_FIREBASE_VAPID_KEY`.
3. Deploy Functions and Hosting.
4. Sign in and enable push notifications from `/notifications`.
5. Confirm a token exists at `users/{userId}/tokens/{tokenId}`.
6. Create a booking due within 24 hours.
7. Run the manual backend reminder scan from `/notifications`.
8. Confirm an in-app notification document is created.
9. Confirm the booking has `reminderSent == true`.
10. Confirm browser push when the browser/device supports it.

The hourly scheduled function uses the same reminder engine, claims reminders atomically,
prevents duplicates, and removes invalid FCM tokens.

## Storage Paths

```text
users/{userId}/{fileName}
agent-verifications/{userId}/{fileName}
properties/{ownerId}/{propertyId}/{fileName}
listings/{ownerId}/{listingId}/{fileName}
listing-private/{ownerId}/{listingId}/{fileName}
```

Storage rules enforce ownership, safe filenames, supported content types, and a 2 MB limit.
Public listing media is readable only after approval. Private listing documents remain owner/admin
only.

## Hosting

Deploy the verified production build:

```powershell
npm run hosting:deploy
```

`firebase.json` configures SPA rewrites, no-cache handling for `index.html` and the messaging
service worker, and immutable caching for hashed assets.

## Production Notes

- Never verify payments only in the browser.
- Re-run security tests after every rules or Storage-path change.
- Keep Firebase Functions and web regions aligned with `VITE_FIREBASE_FUNCTIONS_REGION`.
- Monitor scheduler, webhook, and FCM failures in Functions logs.
- Use a production-ready map tile provider or caching strategy at scale.
- Rotate compromised Firebase/Paystack credentials immediately.
