# RANDSA Current Handoff

## Snapshot

- Workspace: `D:\RANDSA`
- Branch: `main`
- Firebase project: `randsa-67e93`
- Git remote: `https://github.com/Mohd633284/RANDSA.git`
- Primary mode: live Firebase (`VITE_ENABLE_LOCAL_AUTH_BYPASS=false`)
- Product model: unified marketplace account with admin kept separate

## Completed Code Areas

- Authentication and Firestore profiles
- Universal category-driven listing wizard
- Listing drafts, media, private documents, moderation, and My Listings
- Marketplace discovery, cards, saved items, comparison, quick view, and recent history
- Legacy property compatibility
- Adaptive booking modes and backend booking transactions
- Backend Paystack initialization, verification, and webhook processing
- Notification inbox, FCM tokens, push delivery, and scheduled reminder engine
- Leaflet maps and validated coordinates
- Admin moderation and Firebase-mode user data
- Firestore/Storage rules, indexes, and regression tests
- Responsive shell and premium UI pass
- Phase 14 route and authentication hardening

## Latest Security Work

- Write-sensitive routes require an active account.
- Admin routes require an active admin profile.
- Auth return paths reject external/protocol-relative targets.
- New notification tokens require an active account.
- Storage uploads require safe filenames, allowed content types, ownership, and size limits.
- Universal owner uploads retain the Phase 12 lookup-free Storage path.

## Verification Most Recently Passed

- `npm run test:marketplace`: 9 tests
- `npm run test:routes`: 2 tests
- `npm run test:security`: 5 tests
- `npm run build`: TypeScript and Vite production build
- `npm run lint`: zero errors and zero warnings

Run `npm run verify` again immediately before deployment.

## Deployment State

- Final Firestore rules, indexes, and Storage rules were deployed to `randsa-67e93` on
  10 August 2026.
- All eight expected Gen 2 Cloud Functions are active in `us-central1`.
- Commit `f8ac5a9` was pushed to `origin/main` before deployment.
- Firebase Hosting was intentionally not deployed; live acceptance remains pending until hosting.

## Live Checks Still Required

1. Retry universal listing publication after a hard refresh and confirm a pending-review document.
2. Approve that listing as admin and confirm public visibility.
3. Complete one Paystack test-mode checkout and verify Firestore payment/booking updates.
4. Enable push, create a booking within 24 hours, run the reminder scan, confirm the inbox
   notification, and confirm `reminderSent == true`.
5. Re-test Firebase-mode admin user and moderation data.
6. Complete signed-in phone and desktop smoke tests.

## Deferred Product Work

- Dedicated provider/agent view for bookings assigned to that provider
- Bundle and hero-image optimization
- Production map tile-provider/caching review
- Broader automated browser end-to-end coverage

These are follow-ups, not blockers for deploying the current tested feature set unless product
acceptance requires them.

## Next Commands

```powershell
npm run verify
npm run hosting:deploy
```

Run Hosting only after it is explicitly approved. Then use
[docs/RELEASE_CHECKLIST.md](./docs/RELEASE_CHECKLIST.md) for the live acceptance checks.
