You are a senior full-stack developer. Build a modern House & Shop Rent web/mobile app using Ionic Vue + Firebase.

App name: RANDSA

Main goal: Users should be able to rent or list:

1. House rent
2. Shop rent
3. Office space
4. Apartment
5. Self-contained room
6. Flat
7. Duplex

Tech stack:

- Ionic Vue
- Vue 3 Composition API
- Tailwind CSS
- Firebase Authentication
- Firestore Database
- Firebase Storage
- Firebase Cloud Messaging for push reminders
- Firebase Cloud Functions
- Paystack payment integration
- Leaflet.js + OpenStreetMap for map
- Capacitor for Android/iOS

Important note:
Use Leaflet + OpenStreetMap for the free map option.
Do not use Google Maps first because it can become expensive.
Make sure proper OpenStreetMap attribution is shown.

Build the app step by step.

PHASE 1: Project Setup
Create a clean Ionic Vue project with these pages:

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

Use a modern clean UI like Airbnb/PropertyPro style:

- Large property cards
- Rounded corners
- Smooth shadows
- Bottom mobile navigation
- Search bar at the top
- Filter chips
- Location-based browsing
- Skeleton loading
- Empty states
- Pull to refresh
- Infinite scroll
- Dark mode support
- Mobile-first responsive layout

PHASE 2: Authentication
Use Firebase Authentication.

User roles:

- tenant
- landlord
- agent
- admin

During registration, user should choose:

- I want to rent
- I am a landlord
- I am an agent

Store user profile in Firestore:
users/{userId}
{
fullName,
email,
phone,
role,
photoURL,
isVerifiedAgent,
verificationStatus,
createdAt
}

PHASE 3: Property Listing
Allow landlord/agent/admin to upload properties.

Property types:

- House rent
- Shop rent
- Office space
- Land
- Self-contained
- Flat
- Duplex

Property document structure:
properties/{propertyId}
{
title,
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
amenities,
images,
ownerId,
ownerRole,
ownerPhone,
status: "pending" | "approved" | "rejected",
isAvailable,
createdAt,
updatedAt
}

For shop rent, hide bedroom/bathroom fields and show:

- shop size
- road access
- market area
- electricity availability
- security
- water access

For house rent, show:

- bedrooms
- bathrooms
- toilets
- kitchen
- parking
- water
- electricity
- security

PHASE 4: Search and Filter
Add advanced search:

- Search by area
- Search by city
- Search by property type
- Search by price range
- Search by house/shop
- Search by number of bedrooms
- Search by availability
- Sort by newest
- Sort by lowest price
- Sort by highest price

Add filter modal with clean UI.

PHASE 5: Property Details Page
The details page should include:

- Image carousel
- Rent price
- Property title
- Full location
- Map preview
- Amenities
- Agent/landlord profile
- Verification badge
- Call button
- WhatsApp button
- Book inspection button
- Pay inspection fee button
- Save/favorite button
- Report fake listing button

PHASE 6: Agent Verification
Create an agent verification system.

Agent uploads:

- profile photo
- government ID
- CAC document if available
- office address
- phone number
- WhatsApp number
- proof of property authorization

Firestore structure:
agentVerifications/{verificationId}
{
agentId,
fullName,
phone,
officeAddress,
idDocumentUrl,
cacDocumentUrl,
authorizationDocumentUrl,
status: "pending" | "approved" | "rejected",
adminNote,
submittedAt,
reviewedAt
}

Admin can approve or reject.

If approved:

- set users/{agentId}.isVerifiedAgent = true
- show verified badge on all agent properties

PHASE 7: Paystack Payment
Integrate Paystack for:

- inspection fee
- rent deposit
- full rent payment
- service fee

Important:
Never verify payment only from frontend.
Use Firebase Cloud Function to verify Paystack transaction on the backend.

Payment structure:
payments/{paymentId}
{
userId,
propertyId,
agentId,
amount,
paymentType,
paystackReference,
status: "pending" | "success" | "failed",
createdAt,
verifiedAt
}

Payment flow:

1. User clicks Pay
2. App creates payment reference
3. Paystack checkout opens
4. After payment, send reference to Cloud Function
5. Cloud Function verifies transaction with Paystack secret key
6. If successful, update Firestore payment status
7. Create booking or receipt

PHASE 8: Inspection Booking
Users can book inspection.

Booking structure:
bookings/{bookingId}
{
userId,
propertyId,
agentId,
inspectionDate,
inspectionTime,
status: "pending" | "confirmed" | "completed" | "cancelled",
paymentStatus,
reminderSent,
createdAt
}

Booking UI:

- Calendar picker
- Time picker
- Property summary
- Payment status
- Cancel booking button
- Reminder notification

PHASE 9: Push Notification Reminder
Use Firebase Cloud Messaging.

Allow notifications for:

- inspection reminder
- rent due reminder
- payment confirmation
- booking confirmation
- new property approval
- admin message

Store FCM token:
users/{userId}/tokens/{tokenId}
{
token,
device,
createdAt
}

Use Cloud Functions scheduled job to check upcoming bookings and rent due dates.

Example reminder logic:

- Send inspection reminder 24 hours before inspection
- Send rent reminder 7 days before due date
- Send another reminder 1 day before due date

PHASE 10: Map
Use Leaflet.js + OpenStreetMap.

Features:

- Show property location on map
- Allow landlord/agent to select property location
- Save latitude and longitude
- Show nearby area name
- Add marker popup with property title and price

Important:
Add OpenStreetMap attribution.
Do not abuse free OSM tile servers in production.
Structure the code so tile provider can be changed later.

PHASE 11: Saved Properties
Users can save/favorite properties.

savedProperties/{savedId}
{
userId,
propertyId,
createdAt
}

Add saved icon on property cards.

PHASE 12: Admin Dashboard
Admin should manage:

- Pending properties
- Approved properties
- Rejected properties
- Users
- Agents
- Verification requests
- Payments
- Bookings
- Reports

Admin actions:

- Approve property
- Reject property
- Verify agent
- Suspend agent
- Remove fake listing
- View payment records

PHASE 13: UI/UX Requirements
Make the UI premium and modern.

Use:

- Beautiful onboarding screens
- Mobile-first layout
- Property image carousel
- Category chips
- Floating filter button
- Sticky bottom action button
- Verified badges
- Status badges
- Skeleton loading
- Toast messages
- Confirmation modals
- Empty state illustrations
- Smooth page transitions
- Clean dashboard cards
- Responsive web layout

Mobile navigation:

- Home
- Search
- Add Property
- Bookings
- Profile

PHASE 14: Security Rules
Write Firebase security rules.

Rules must ensure:

- Only logged-in users can save/book/pay
- Only owner can edit their property
- Only admin can approve/reject properties
- Only admin can verify agents
- Users can only read their own payments
- Public users can only see approved properties

PHASE 15: Final Deliverables
Give me:

1. Complete folder structure
2. Firebase setup guide
3. Firestore collection structure
4. Pages and components
5. Paystack Cloud Function code
6. Firebase notification setup
7. Leaflet map integration
8. Security rules
9. Step-by-step implementation
10. Clean responsive UI

Start by creating the folder structure and base pages first.
Then implement each phase one by one without breaking existing code.
