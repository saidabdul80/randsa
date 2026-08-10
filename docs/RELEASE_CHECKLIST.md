# RANDSA Release Checklist

## 1. Preflight

- Confirm `.env.local` uses live Firebase mode.
- Confirm Firebase project `randsa-67e93` is selected.
- Confirm Email/Password and Google providers are enabled.
- Confirm the deployed domain is authorized for Firebase Authentication.
- Confirm the Web Push VAPID key and Paystack public key are present.
- Confirm `PAYSTACK_SECRET_KEY` exists in Firebase Functions secrets.

## 2. Automated Gate

```powershell
npm run verify
```

Do not deploy with lint errors, failing tests, TypeScript errors, or a failed production build.
Record non-blocking warnings in the release notes.

## 3. Commit and Push

Review the dirty worktree carefully because the project contains changes from many phases.
Commit the complete verified set, then push `main` to `origin`.

```powershell
git status --short
git diff --check
git add <reviewed-files>
git commit -m "Complete RANDSA universal marketplace release"
git push origin main
```

## 4. Firebase Deployment

```powershell
npm run firebase:login:list
npm run rules:deploy
npx firebase-tools@13.35.1 deploy --only functions
npm run hosting:deploy
```

Deploy rules before relying on the Phase 14 token and filename hardening. Deploy Hosting only from
the same verified source revision used for Functions and rules.

## 5. Live Smoke Test

### Authentication

- Register a regular account without choosing a legacy role.
- Sign out and sign in with email/password.
- Test Google sign-in and return routing.
- Confirm a regular active account can open Post Listing.
- Confirm a non-admin cannot open `/admin`.

### Listing and moderation

- Publish a universal listing with valid images.
- Confirm progress completes and a pending-review document is created.
- Confirm another regular user cannot read the pending listing.
- Approve it as admin.
- Confirm it appears publicly and its media loads.
- Edit and delete an owned test listing.

### Booking and payment

- Create a booking using its configured booking mode.
- Confirm conflicting dates/times are rejected.
- Complete one Paystack test payment.
- Confirm backend-verified payment and related booking updates.

### Notifications

- Enable browser push and confirm token registration.
- Create a booking within the next 24 hours.
- Run the backend reminder scan.
- Confirm notification document, in-app inbox item, browser push when supported, and
  `reminderSent == true`.

### Responsive UI

- Phone: Home, listing cards, details, Post Listing, bookings, notifications, and profile.
- Desktop: Home marketplace, My Listings, details, Account Center, and Admin.
- Confirm no blank protected pages, horizontal overflow, overlapping controls, or stretched images.

## 6. Release Record

Record:

- Git commit SHA
- Hosting release time and URL
- Firestore and Storage ruleset identifiers
- deployed Functions revision/time
- Paystack test reference
- FCM test user, booking ID, and notification ID
- any accepted warnings or deferred items

## 7. Rollback Readiness

- Keep the previous known-good Git commit and Hosting release identifier.
- Use Firebase Hosting release rollback if the web release fails.
- Restore the previous reviewed ruleset only if a new rule blocks valid production behavior.
- Never use broad allow-all rules as a rollback.
