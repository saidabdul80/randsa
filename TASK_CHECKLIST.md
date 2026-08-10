# RANDSA Release Checklist

## Code Complete

- [x] Unified authentication and user profiles
- [x] Universal listing categories and dynamic form
- [x] Draft, publish, edit, moderation, and My Listings flows
- [x] Marketplace discovery, details, save, compare, quick view, and recently viewed
- [x] Adaptive booking and backend availability checks
- [x] Backend-authoritative Paystack flow
- [x] Notification inbox, FCM integration, and reminder engine
- [x] Leaflet/OpenStreetMap integration
- [x] Admin moderation and user management
- [x] Firestore/Storage rules and indexes
- [x] Responsive UI consolidation
- [x] Route, redirect, account-status, and upload hardening
- [x] Final documentation set

## Automated Verification

- [x] Marketplace tests
- [x] Route-security tests
- [x] Firebase configuration/security tests
- [x] Functions tests rerun in the final Phase 15 verification
- [x] Repository lint rerun in the final Phase 15 verification
- [x] Production build rerun in the final Phase 15 verification

## Deployment

- [x] Commit the final verified Phase 15 changes
- [x] Push the final commit to GitHub
- [x] Deploy Phase 14 Firestore/Storage rules and indexes
- [x] Deploy Cloud Functions
- [ ] Deploy Firebase Hosting

## Live Acceptance

- [ ] Publish a universal listing with images after a hard refresh
- [ ] Confirm it is created with pending-review moderation state
- [ ] Approve it as admin and confirm public visibility
- [ ] Complete and verify one Paystack test payment
- [ ] Register a real browser FCM token
- [ ] Run the reminder scan for a booking within 24 hours
- [ ] Confirm notification document and `reminderSent == true`
- [ ] Confirm saved listings persist in another browser session
- [ ] Complete signed-in phone and desktop smoke tests

## Deferred

- [ ] Dedicated provider/agent assigned-bookings view
- [ ] Main bundle and hero-image optimization
- [ ] Production map tile-provider review
- [ ] Full browser end-to-end automation
