# RANDSA Final Deliverables

## 1. Complete Folder Structure

High-signal project structure:

```text
RANDSA
├── src
│   ├── assets
│   ├── components
│   │   ├── layout
│   │   ├── map
│   │   ├── navigation
│   │   ├── profile
│   │   ├── property
│   │   └── verification
│   ├── composables
│   ├── lib
│   ├── router
│   ├── services
│   ├── theme
│   ├── types
│   └── views
├── public
│   ├── firebase-messaging-sw.js
│   └── firebaseseetings
├── functions
│   ├── index.js
│   └── package.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── PROJECT_PLAN.md
├── TASK_CHECKLIST.md
└── README.md
```

Detailed app folders:

- `src/views`: app pages
- `src/components/property`: listing form, uploader, filters, sort, field groups
- `src/components/map`: map preview and location picker
- `src/components/verification`: verification document upload UI
- `src/services`: business logic and storage/data access
- `src/composables`: shared state wrappers for auth, properties, payments, bookings, notifications, verification, saved properties
- `src/lib`: Firebase bootstrapping, Paystack loader, map config, image compression, messaging

## 2. Firebase Setup Guide

Use the full setup guide in [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md).

Short version:

1. Create or select your Firebase project
2. Enable:
   - Authentication
   - Firestore
   - Storage
   - Cloud Functions
   - Cloud Messaging
3. Fill `.env.local`
4. Install Functions dependencies:
   - `cd functions`
   - `npm.cmd install`
5. Set the Paystack secret:
   - `firebase functions:secrets:set PAYSTACK_SECRET_KEY`
6. Deploy:
   - `firebase deploy --only firestore:rules,firestore:indexes,storage`
   - `firebase deploy --only functions`

## 3. Firestore Collection Structure

Implemented and planned structure:

### `users/{userId}`

```ts
{
  ;(fullName, email, phone, role, photoURL, isVerifiedAgent, verificationStatus, createdAt)
}
```

### `users/{userId}/tokens/{tokenId}`

```ts
{
  ;(userId, token, device, createdAt)
}
```

### `properties/{propertyId}`

```ts
{
  ;(title,
    description,
    category,
    propertyType,
    rentPrice,
    cautionFee,
    agencyFee,
    inspectionFee,
    paymentDuration,
    state,
    city,
    area,
    address,
    latitude,
    longitude,
    bedrooms,
    bathrooms,
    toilets,
    shopSize,
    roadAccess,
    marketArea,
    electricityAvailability,
    security,
    waterAccess,
    kitchen,
    parking,
    water,
    electricity,
    amenities,
    images,
    ownerId,
    ownerRole,
    ownerPhone,
    status,
    isAvailable,
    createdAt,
    updatedAt)
}
```

### `agentVerifications/{verificationId}`

```ts
{
  ;(agentId,
    fullName,
    phone,
    whatsappNumber,
    officeAddress,
    profilePhoto,
    idDocument,
    cacDocument,
    authorizationDocument,
    status,
    adminNote,
    submittedAt,
    reviewedAt)
}
```

### `payments/{paymentId}`

```ts
{
  ;(userId,
    propertyId,
    agentId,
    propertyTitle,
    payerName,
    payerEmail,
    amount,
    paymentType,
    paystackReference,
    status,
    verificationMode,
    createdAt,
    verifiedAt)
}
```

### `bookings/{bookingId}`

```ts
{
  ;(userId,
    propertyId,
    agentId,
    inspectionDate,
    inspectionTime,
    status,
    paymentStatus,
    reminderSent,
    guestPhone,
    notes,
    createdAt,
    updatedAt)
}
```

### `savedProperties/{savedId}`

```ts
{
  ;(userId, propertyId, createdAt)
}
```

### `notifications/{notificationId}`

```ts
{
  ;(userId,
    type,
    title,
    body,
    channel,
    relatedPropertyId,
    relatedBookingId,
    relatedPaymentId,
    createdAt,
    deliveredAt,
    readAt)
}
```

## 4. Pages and Components

Main pages in `src/views`:

- SplashScreen
- OnboardingPage
- LoginPage
- RegisterPage
- HomePage
- PropertyListPage
- PropertyDetailsPage
- AddPropertyPage
- EditPropertyPage
- SavedPropertiesPage
- BookingPage
- MyBookingsPage
- PaymentPage
- AgentVerificationPage
- NotificationsPage
- ProfilePage
- AdminDashboardPage

Important shared components:

- `AppShell.vue`
- `AppBottomNav.vue`
- `PropertyForm.vue`
- `PropertyImageUploader.vue`
- `PropertyFilterPanel.vue`
- `PropertySortSelect.vue`
- `PropertyLocationPicker.vue`
- `PropertyMapPreview.vue`
- `VerificationUploadField.vue`
- `StoragePathTester.vue`

## 5. Paystack Cloud Function Code

The real Paystack verification function lives in:

- [functions/index.js](./functions/index.js)

Current callable exports:

- `verifyPaystackPayment`
- `createNotificationRecord`

`verifyPaystackPayment` does the right backend shape already:

- requires auth
- loads the payment document
- checks ownership
- verifies the Paystack reference against Paystack’s API
- checks amount match
- updates Firestore with verified status

Important deployment reminder:

- `verifyPaystackPayment` is coded, but the live secret/deploy flow still needs to be completed and re-tested end to end.

## 6. Firebase Notification Setup

Current implementation status:

- Firebase Messaging token registration exists in `src/lib/messaging.ts`
- Service worker exists in `public/firebase-messaging-sw.js`
- Token records save to `users/{userId}/tokens/{tokenId}`
- Notification records are created through the callable function `createNotificationRecord`
- Browser push delivery is attempted from the Cloud Function using saved tokens

Still deferred:

- scheduled backend reminder jobs for bookings and rent due dates
- production-grade reminder orchestration
- full end-to-end live FCM re-test after the latest cleanup

## 7. Leaflet Map Integration

Current map implementation:

- Leaflet + OpenStreetMap is active
- property details page shows a map preview
- add/edit property flows support location selection
- latitude and longitude are saved in property records
- OpenStreetMap attribution is included
- map setup is isolated so the tile provider can be swapped later if needed

Key files:

- `src/components/map/PropertyMapPreview.vue`
- `src/components/map/PropertyLocationPicker.vue`
- `src/lib/map.ts`

## 8. Security Rules

Current security files:

- [firestore.rules](./firestore.rules)
- [storage.rules](./storage.rules)
- [firestore.indexes.json](./firestore.indexes.json)

The rules now cover:

- auth-required save/book/pay flows
- owner-only property edits
- admin-only listing review
- admin-only agent review
- user-only payment reads
- approved-public property reads
- protected upload paths for:
  - `properties/{ownerId}/{propertyId}/{fileName}`
  - `agent-verifications/{agentId}/{fileName}`
  - `users/{userId}/{fileName}`

## 9. Step-by-Step Implementation

Use [docs/IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md) for the full phase-by-phase breakdown.

## 10. Clean Responsive UI

Current UI state:

- shared shell and mobile navigation
- responsive layouts across home, listings, details, profile, and admin
- upgraded premium card system
- stronger search and catalog layout
- improved property details action stack
- cleaner admin dashboard hierarchy

Note:

- the latest Phase 13 visual pass should still be reviewed manually across mobile and desktop before calling the UI fully final.

## Deferred / Return Later

These are the main items we intentionally parked and should revisit:

1. Complete live Paystack backend deployment and end-to-end verification testing
2. Finish scheduled FCM reminder backend flow
3. Reconfirm the latest UI pass visually after the blank-page regression fixes
4. Re-test admin dashboard behavior fully in Firebase mode
5. Revisit large bundle warnings when product stability work is complete
