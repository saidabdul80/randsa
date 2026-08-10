# RANDSA Delivery Plan

## Product Direction

RANDSA is a universal rental and marketplace product. Every active registered account can
browse, book, pay, save, and publish listings. Landlord, tenant, and agent values are retained
only for compatibility where older records require them. Admin remains a privileged role.

## Delivered Phases

### Phases 1-2: Foundation and Accounts

- Ionic Vue application shell, routes, responsive navigation, and theme
- Firebase email/password and Google authentication
- Firestore profiles and profile completion
- Unified account posting access with admin kept separate

### Phases 3-5: Marketplace Creation and Discovery

- Category/subcategory configuration
- Multi-step dynamic listing form
- Universal listing schema, drafts, media, private documents, and My Listings
- Responsive marketplace cards, filters, quick view, comparison, and details
- Legacy property compatibility

### Phases 6-8: Trust, Payments, and Booking

- Optional professional verification and admin review
- Backend Paystack initialization, verification, and webhook handling
- Adaptive booking modes, availability checks, creation, management, and cancellation

### Phases 9-12: Notifications, Maps, Persistence, and Rules

- FCM tokens, notification inbox, scheduled reminders, and manual reminder scan
- Leaflet/OpenStreetMap previews and coordinate selection
- Firestore-backed saved items and migration support
- Field-validated Firestore/Storage rules and required indexes

### Phases 13-14: UI and Security Consolidation

- Shared shell, responsive marketplace UI, account/admin surfaces, and bottom navigation
- Active-account route guards and admin-only handling
- Safe authentication redirects
- Token, saved-item, payment, notification, and upload hardening

### Phase 15: Release Readiness

- Accurate README and final deliverables
- Firebase and release guides
- Current handoff and deferred-item tracking
- Complete automated verification and deployment checklist

## Release Gates

### Automated gate

```powershell
npm run verify
```

Must finish with:

- zero lint errors
- all marketplace, route, security, and Functions tests passing
- TypeScript and production build passing

### Live Firebase gate

- universal listing publication and moderation confirmed
- Phase 14 rules deployed
- Firebase-mode admin data confirmed
- saved-item persistence confirmed across sessions

### Live payment and notification gate

- Paystack test payment verified by backend
- FCM token registered
- reminder scan creates an inbox record and sets `reminderSent == true`

### Visual gate

- signed-in phone and desktop smoke test of core routes
- no horizontal overflow, blank protected views, broken images, or inaccessible primary actions

## Deferred Backlog

- Dedicated provider booking-management view
- Main bundle code splitting
- Hero image compression and modern formats
- Production map tile strategy
- Full automated end-to-end browser suite
