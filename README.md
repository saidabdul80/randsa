# RANDSA

RANDSA is a modern Ionic Vue property app for house rent and property listing workflows. It currently covers the core renter, landlord, agent, and admin flows across authentication, property listing, search, details, saved properties, bookings, payments, verification, security rules, and a premium mobile-first UI pass.

## Stack

- Ionic Vue
- Vue 3 Composition API
- Tailwind CSS
- Firebase Authentication
- Firestore
- Firebase Storage
- Firebase Cloud Functions
- Firebase Cloud Messaging
- Paystack
- Leaflet.js + OpenStreetMap

## Current Status

- Phases 1 to 15 have been implemented in the repo at the documentation level.
- A few backend cleanup items are intentionally deferred and documented before production rollout.
- Local bypass helpers still exist for selected development workflows, but the project is now primarily wired for real Firebase mode.

## Project Docs

- [FINAL_DELIVERABLES.md](./FINAL_DELIVERABLES.md)
- [docs/FIREBASE_SETUP.md](./docs/FIREBASE_SETUP.md)
- [docs/IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md)
- [PROJECT_PLAN.md](./PROJECT_PLAN.md)
- [TASK_CHECKLIST.md](./TASK_CHECKLIST.md)

## Scripts

```bash
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
npm.cmd run firebase:login
npm.cmd run firebase:login:list
npm.cmd run firebase:use
npm.cmd run rules:deploy
```

## Environment

Copy `.env.example` into `.env.local` and fill in your real Firebase and Paystack values.

Important keys:

- `VITE_ENABLE_LOCAL_AUTH_BYPASS`
- `VITE_ENABLE_LOCAL_PAYMENT_BYPASS`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_FUNCTIONS_REGION`
- `VITE_FIREBASE_VAPID_KEY`
- `VITE_PAYSTACK_PUBLIC_KEY`

## Important Deferred Items

- Deploy and complete the real Paystack backend verification flow
- Finish the remaining scheduled FCM reminder backend work
- Reconfirm the latest UI pass visually across all major screens
- Re-run production deploy checks after the latest Phase 13 and 14 updates
