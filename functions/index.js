const admin = require('firebase-admin')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const {
  getBookingModeConfig,
  getAvailabilityConfig,
  getEligibleAgentSchedules,
  getBookingRange,
  isInspectionMode,
  rangesOverlap,
  resolveBookingMode,
  sanitizeCategoryDetails,
  usesTimeSlotTimeline,
  validateBookingSelection,
} = require('./booking-engine')

admin.initializeApp()

const db = admin.firestore()
const paystackSecretKey = defineSecret('PAYSTACK_SECRET_KEY')

function normalizeTimestamp(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }

  return value ? String(value) : null
}

function mapPaymentSnapshot(snapshot) {
  const data = snapshot.data() || {}

  return {
    id: snapshot.id,
    userId: data.userId || '',
    propertyId: data.propertyId || '',
    bookingId: data.bookingId || null,
    agentId: data.agentId || '',
    propertyTitle: data.propertyTitle || '',
    payerName: data.payerName || '',
    payerEmail: data.payerEmail || '',
    amount: Number(data.amount || 0),
    paymentType: data.paymentType || 'inspection_fee',
    paystackReference: data.paystackReference || '',
    status: data.status || 'pending',
    verificationMode: data.verificationMode || 'backend_required',
    createdAt: normalizeTimestamp(data.createdAt) || new Date().toISOString(),
    verifiedAt: normalizeTimestamp(data.verifiedAt),
    gatewayStatus: data.gatewayStatus || null,
    gatewayVerifiedAt: normalizeTimestamp(data.gatewayVerifiedAt),
  }
}

function getExpectedPaymentAmount(property, paymentType) {
  if (paymentType === 'inspection_fee') {
    return Number(property.inspectionFee || 0)
  }

  if (paymentType === 'rent_deposit') {
    return Number(property.cautionFee || 0)
  }

  if (paymentType === 'service_fee') {
    return Number(property.agencyFee || 0)
  }

  if (paymentType === 'full_rent_payment') {
    return Number(property.rentPrice || 0)
  }

  return 0
}

async function assertPaymentMatchesProperty(payment) {
  const propertyId = String(payment.propertyId || '').trim()

  if (!propertyId) {
    throw new HttpsError('failed-precondition', 'Payment record is missing a property ID.')
  }

  const propertySnapshot = await db.collection('properties').doc(propertyId).get()

  if (!propertySnapshot.exists) {
    throw new HttpsError('not-found', 'The property tied to this payment was not found.')
  }

  const property = propertySnapshot.data() || {}
  const paymentType = String(payment.paymentType || '').trim()
  let expectedAmount = getExpectedPaymentAmount(property, paymentType)
  let bookingSnapshot = null

  if (paymentType === 'booking_payment') {
    const bookingId = String(payment.bookingId || '').trim()
    if (!bookingId) {
      throw new HttpsError('failed-precondition', 'Booking payment is missing a booking ID.')
    }

    bookingSnapshot = await db.collection('bookings').doc(bookingId).get()
    const booking = bookingSnapshot.data()
    if (
      !bookingSnapshot.exists ||
      booking?.userId !== payment.userId ||
      booking?.propertyId !== propertyId
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Booking payment did not match the selected booking.'
      )
    }
    expectedAmount = Number(booking.estimatedTotal || 0)
  }
  const recordedAmount = Number(payment.amount || 0)

  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    throw new HttpsError(
      'failed-precondition',
      'The selected payment type is not configured for this property.'
    )
  }

  if (recordedAmount !== expectedAmount) {
    throw new HttpsError(
      'failed-precondition',
      `Payment amount mismatch. Expected ${expectedAmount} NGN for ${paymentType} but received ${recordedAmount} NGN.`
    )
  }

  if (payment.agentId && property.ownerId && String(payment.agentId) !== String(property.ownerId)) {
    throw new HttpsError('failed-precondition', 'Payment agent did not match the property owner.')
  }

  return { property, expectedAmount, bookingSnapshot }
}

function mapBookingSnapshot(snapshot) {
  const data = snapshot.data() || {}
  const range = getBookingRange(data)

  return {
    id: snapshot.id,
    userId: data.userId || '',
    propertyId: data.propertyId || data.listingId || '',
    listingId: data.listingId || data.propertyId || '',
    agentId: data.agentId || '',
    bookingMode: data.bookingMode || 'property_inspection',
    listingCategory: data.listingCategory || '',
    inspectionDate: data.inspectionDate || '',
    inspectionTime: data.inspectionTime || '',
    startAt: range?.startAt.toISOString() || '',
    endAt: range?.endAt.toISOString() || '',
    durationMinutes: Number(data.durationMinutes || range?.durationMinutes || 30),
    quantity: Math.max(1, Number(data.quantity || 1)),
    pricingUnit: data.pricingUnit || 'per_inspection',
    estimatedTotal:
      data.estimatedTotal === null || data.estimatedTotal === undefined
        ? null
        : Number(data.estimatedTotal),
    categoryDetails:
      data.categoryDetails && typeof data.categoryDetails === 'object' ? data.categoryDetails : {},
    status: data.status || 'pending',
    paymentStatus: data.paymentStatus || 'pending',
    reminderSent: data.reminderSent === true,
    guestPhone: data.guestPhone || '',
    notes: data.notes || '',
    createdAt: normalizeTimestamp(data.createdAt) || new Date().toISOString(),
    updatedAt:
      normalizeTimestamp(data.updatedAt) ||
      normalizeTimestamp(data.createdAt) ||
      new Date().toISOString(),
  }
}

async function assertPropertyVisibleToUser(propertySnapshot, userId) {
  if (!propertySnapshot.exists) {
    throw new HttpsError('not-found', 'The selected listing was not found.')
  }

  const property = propertySnapshot.data() || {}
  if (property.status === 'approved' || property.ownerId === userId) return property

  const userSnapshot = await db.collection('users').doc(userId).get()
  if (userSnapshot.data()?.role === 'admin') return property
  throw new HttpsError('permission-denied', 'This listing is not available to your account.')
}

function toHttpsBookingError(error) {
  if (error instanceof HttpsError) return error
  const message =
    error instanceof Error ? error.message : 'The booking request could not be validated.'
  return new HttpsError('failed-precondition', message)
}

function buildBookingConfirmationCopy(booking, propertyTitle) {
  const config = getBookingModeConfig(booking.bookingMode)
  const formattedStart = new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(booking.startAt))
  return {
    title: `${config.primaryActionLabel} confirmed`,
    body: `${propertyTitle} is booked for ${formattedStart}.`,
  }
}

async function ensureBookingConfirmationNotification(booking, propertyTitle) {
  const confirmationCopy = buildBookingConfirmationCopy(booking, propertyTitle || 'Your listing')
  return createNotificationDocument({
    userId: booking.userId,
    type: 'booking_confirmation',
    title: confirmationCopy.title,
    body: confirmationCopy.body,
    channel: await getNotificationChannelForUser(booking.userId),
    relatedPropertyId: booking.propertyId,
    relatedBookingId: booking.id,
    relatedPaymentId: null,
  })
}

function sanitizeIdSegment(value) {
  return (
    String(value || 'none')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 80) || 'none'
  )
}

function buildNotificationId(input) {
  if (input.relatedBookingId) {
    return `notification-${input.type}-${sanitizeIdSegment(input.userId)}-${sanitizeIdSegment(input.relatedBookingId)}`
  }

  if (input.relatedPaymentId) {
    return `notification-${input.type}-${sanitizeIdSegment(input.userId)}-${sanitizeIdSegment(input.relatedPaymentId)}`
  }

  if (input.relatedPropertyId) {
    return `notification-${input.type}-${sanitizeIdSegment(input.userId)}-${sanitizeIdSegment(input.relatedPropertyId)}`
  }

  return `notification-${sanitizeIdSegment(input.type)}-${sanitizeIdSegment(input.userId)}-${Date.now()}`
}

function mapNotificationSnapshot(snapshot) {
  const data = snapshot.data() || {}

  return {
    id: snapshot.id,
    userId: data.userId || '',
    type: data.type || 'admin_message',
    title: data.title || '',
    body: data.body || '',
    channel: data.channel || 'in_app',
    relatedPropertyId: data.relatedPropertyId || null,
    relatedBookingId: data.relatedBookingId || null,
    relatedPaymentId: data.relatedPaymentId || null,
    createdAt: normalizeTimestamp(data.createdAt) || new Date().toISOString(),
    deliveredAt: normalizeTimestamp(data.deliveredAt),
    readAt: normalizeTimestamp(data.readAt),
  }
}

async function createNotificationDocument(input) {
  const notificationId = buildNotificationId(input)
  const notificationRef = db.collection('notifications').doc(notificationId)
  const existingSnapshot = await notificationRef.get()

  if (existingSnapshot.exists) {
    return mapNotificationSnapshot(existingSnapshot)
  }

  await notificationRef.set({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    channel: input.channel,
    relatedPropertyId: input.relatedPropertyId,
    relatedBookingId: input.relatedBookingId,
    relatedPaymentId: input.relatedPaymentId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
    readAt: null,
  })

  const createdSnapshot = await notificationRef.get()
  const notification = mapNotificationSnapshot(createdSnapshot)

  if (notification.channel === 'browser') {
    await sendBrowserNotification(input.userId, notification)
  }

  return notification
}

async function getNotificationChannelForUser(userId) {
  const tokensSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('tokens')
    .limit(1)
    .get()
  return tokensSnapshot.empty ? 'in_app' : 'browser'
}

function isBookingEligibleForReminder(data) {
  return (
    data && data.reminderSent !== true && data.status !== 'cancelled' && data.status !== 'completed'
  )
}

function getTimeUntilInspectionMs(data) {
  const range = getBookingRange(data)
  return range ? range.startAt.getTime() - Date.now() : Number.POSITIVE_INFINITY
}

async function processInspectionReminderSnapshots(bookingSnapshots) {
  const created = []

  for (const bookingSnapshot of bookingSnapshots) {
    const data = bookingSnapshot.data() || {}

    if (!isBookingEligibleForReminder(data)) {
      continue
    }

    const timeUntilInspection = getTimeUntilInspectionMs(data)

    if (
      !Number.isFinite(timeUntilInspection) ||
      timeUntilInspection < 0 ||
      timeUntilInspection > 24 * 60 * 60 * 1000
    ) {
      continue
    }

    const bookingMode = data.bookingMode || 'property_inspection'
    const modeConfig = getBookingModeConfig(bookingMode)
    let propertyTitle = 'your booking'

    if (data.propertyId) {
      const propertySnapshot = await db.collection('properties').doc(String(data.propertyId)).get()
      propertyTitle = propertySnapshot.data()?.title || propertyTitle
    }

    const channel = await getNotificationChannelForUser(String(data.userId || ''))
    const notification = await createNotificationDocument({
      userId: String(data.userId || ''),
      type: 'inspection_reminder',
      title: modeConfig.reminderTitle,
      body: `${modeConfig.reminderLead} for ${propertyTitle} begins within the next 24 hours.`,
      channel,
      relatedPropertyId: data.propertyId ? String(data.propertyId) : null,
      relatedBookingId: bookingSnapshot.id,
      relatedPaymentId: null,
    })

    await bookingSnapshot.ref.update({
      reminderSent: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    created.push(notification)
  }

  return created
}

exports.getBookingAvailability = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in before checking booking availability.')
  }

  const propertyId = String(request.data?.propertyId || '').trim()
  if (!propertyId) {
    throw new HttpsError('invalid-argument', 'A listing ID is required.')
  }

  const propertySnapshot = await db.collection('properties').doc(propertyId).get()
  await assertPropertyVisibleToUser(propertySnapshot, request.auth.uid)

  const snapshot = await db
    .collection('bookings')
    .where('propertyId', '==', propertyId)
    .limit(500)
    .get()
  const bookings = snapshot.docs
    .filter((document) => {
      const status = document.data()?.status
      return status !== 'cancelled' && status !== 'completed'
    })
    .map((document) => {
      const booking = mapBookingSnapshot(document)
      return {
        id: booking.id,
        propertyId: booking.propertyId,
        agentId: booking.agentId,
        status: booking.status,
        bookingMode: booking.bookingMode,
        startAt: booking.startAt,
        endAt: booking.endAt,
        inspectionDate: booking.inspectionDate,
        inspectionTime: booking.inspectionTime,
        durationMinutes: booking.durationMinutes,
      }
    })

  return { bookings }
})

exports.createUniversalBooking = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in before creating a booking.')
  }

  const input = request.data || {}
  const propertyId = String(input.propertyId || '').trim()
  const requestId = String(input.requestId || '').trim()
  if (!propertyId || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
    throw new HttpsError('invalid-argument', 'A listing ID and valid request ID are required.')
  }

  const bookingRef = db.collection('bookings').doc(`booking-${requestId}`)
  const existingBookingSnapshot = await bookingRef.get()
  if (existingBookingSnapshot.exists) {
    const existingBooking = mapBookingSnapshot(existingBookingSnapshot)
    if (existingBooking.userId !== request.auth.uid || existingBooking.propertyId !== propertyId) {
      throw new HttpsError('permission-denied', 'This booking request ID is already in use.')
    }
    const existingPropertySnapshot = await db.collection('properties').doc(propertyId).get()
    await ensureBookingConfirmationNotification(
      existingBooking,
      existingPropertySnapshot.data()?.title || 'Your listing'
    )
    return { booking: existingBooking }
  }

  const propertyRef = db.collection('properties').doc(propertyId)
  const initialPropertySnapshot = await propertyRef.get()
  const initialProperty = await assertPropertyVisibleToUser(
    initialPropertySnapshot,
    request.auth.uid
  )
  const requestingUserSnapshot = await db.collection('users').doc(request.auth.uid).get()
  const requestingUserIsAdmin = requestingUserSnapshot.data()?.role === 'admin'
  let initialSelection
  try {
    initialSelection = validateBookingSelection(input, initialProperty)
  } catch (error) {
    throw toHttpsBookingError(error)
  }

  const paymentSnapshot = await db
    .collection('payments')
    .where('userId', '==', request.auth.uid)
    .where('propertyId', '==', propertyId)
    .get()
  const latestInspectionPayment = paymentSnapshot.docs
    .map((document) => document.data())
    .filter((payment) => payment.paymentType === 'inspection_fee')
    .sort(
      (left, right) => (right.createdAt?.toMillis?.() || 0) - (left.createdAt?.toMillis?.() || 0)
    )[0]
  const initialPaymentStatus = isInspectionMode(initialSelection.bookingMode)
    ? latestInspectionPayment?.status || 'pending'
    : 'pending'

  let createdSnapshot
  try {
    await db.runTransaction(async (transaction) => {
      const existingSnapshot = await transaction.get(bookingRef)
      if (existingSnapshot.exists) {
        if (existingSnapshot.data()?.userId !== request.auth.uid) {
          throw new HttpsError('permission-denied', 'This booking request ID is already in use.')
        }
        return
      }

      const propertySnapshot = await transaction.get(propertyRef)
      const property = propertySnapshot.data()
      if (!propertySnapshot.exists || !property) {
        throw new HttpsError('not-found', 'The selected listing was not found.')
      }
      if (
        property.status !== 'approved' &&
        property.ownerId !== request.auth.uid &&
        !requestingUserIsAdmin
      ) {
        throw new HttpsError('permission-denied', 'This listing is not available to your account.')
      }

      const selection = validateBookingSelection(input, property)
      const availabilityConfig = getAvailabilityConfig(property, selection.bookingMode)
      const bookingsQuery = db.collection('bookings').where('propertyId', '==', propertyId)
      const bookingsSnapshot = await transaction.get(bookingsQuery)
      const activeBookingDocs = bookingsSnapshot.docs.filter((document) => {
        const status = document.data()?.status
        return status !== 'cancelled' && status !== 'completed'
      })

      for (const document of activeBookingDocs) {
        const data = document.data() || {}
        if (
          isInspectionMode(selection.bookingMode) &&
          data.userId === request.auth.uid &&
          isInspectionMode(data.bookingMode || 'property_inspection')
        ) {
          throw new HttpsError(
            'already-exists',
            'You already have an active inspection booking for this listing. Cancel it first if you need a new time.'
          )
        }
      }

      let assignedAgentId = String(property.ownerId || '')
      if (usesTimeSlotTimeline(selection.bookingMode)) {
        const eligibleAgents = getEligibleAgentSchedules(property, selection, input)
        const availableAgent = eligibleAgents.find((agent) => {
          const agentBookings = activeBookingDocs.filter(
            (document) =>
              String(document.data()?.agentId || property.ownerId || '') === agent.agentId
          )
          const bookingsOnDate = agentBookings.filter(
            (document) => document.data()?.inspectionDate === input.inspectionDate
          )
          if (bookingsOnDate.length >= agent.maximumInspectionsPerDay) return false

          return !agentBookings.some((document) => {
            const existingRange = getBookingRange(document.data())
            return (
              existingRange &&
              rangesOverlap(
                selection.startAt,
                selection.endAt,
                existingRange.startAt,
                existingRange.endAt,
                availabilityConfig.bufferMinutes
              )
            )
          })
        })

        if (!availableAgent) {
          throw new HttpsError(
            'already-exists',
            'This time is no longer available. Please select another option.'
          )
        }
        assignedAgentId = availableAgent.agentId
      } else {
        for (const document of activeBookingDocs) {
          const existingRange = getBookingRange(document.data())
          if (
            existingRange &&
            rangesOverlap(
              selection.startAt,
              selection.endAt,
              existingRange.startAt,
              existingRange.endAt,
              availabilityConfig.bufferMinutes
            )
          ) {
            throw new HttpsError(
              'already-exists',
              'This time is no longer available. Please select another option.'
            )
          }
        }
      }

      transaction.set(bookingRef, {
        userId: request.auth.uid,
        propertyId,
        listingId: propertyId,
        agentId: assignedAgentId,
        bookingMode: selection.bookingMode,
        listingCategory: String(property.propertyType || property.category || ''),
        inspectionDate: String(input.inspectionDate || ''),
        inspectionTime: String(input.inspectionTime || ''),
        startAt: admin.firestore.Timestamp.fromDate(selection.startAt),
        endAt: admin.firestore.Timestamp.fromDate(selection.endAt),
        durationMinutes: selection.durationMinutes,
        quantity: selection.quantity,
        pricingUnit: selection.pricingUnit,
        estimatedTotal: selection.estimatedTotal,
        categoryDetails: sanitizeCategoryDetails(input.categoryDetails),
        status: 'pending',
        paymentStatus: initialPaymentStatus,
        reminderSent: false,
        guestPhone: String(input.guestPhone || '')
          .trim()
          .slice(0, 40),
        notes: String(input.notes || '')
          .trim()
          .slice(0, 2000),
        requestId,
        schemaVersion: 2,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    createdSnapshot = await bookingRef.get()
  } catch (error) {
    throw toHttpsBookingError(error)
  }

  const booking = mapBookingSnapshot(createdSnapshot)
  await ensureBookingConfirmationNotification(booking, initialProperty.title || 'Your listing')

  return { booking }
})

async function sendBrowserNotification(userId, notification) {
  const tokensSnapshot = await db.collection('users').doc(userId).collection('tokens').get()
  const tokenDocs = tokensSnapshot.docs.filter((docSnapshot) => {
    const tokenValue = docSnapshot.data()?.token
    return typeof tokenValue === 'string' && tokenValue.length > 0
  })

  if (!tokenDocs.length) {
    return
  }

  const tokens = tokenDocs.map((docSnapshot) => docSnapshot.data().token)
  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: {
      notificationId: notification.id,
      type: notification.type,
      relatedPropertyId: notification.relatedPropertyId || '',
      relatedBookingId: notification.relatedBookingId || '',
      relatedPaymentId: notification.relatedPaymentId || '',
      link: '/notifications',
    },
    webpush: {
      fcmOptions: {
        link: '/notifications',
      },
    },
  })

  const staleTokenRefs = response.responses
    .map((result, index) => ({ result, ref: tokenDocs[index].ref }))
    .filter(({ result }) => {
      const code = result.error?.code || ''
      return (
        code.includes('registration-token-not-registered') ||
        code.includes('invalid-registration-token')
      )
    })
    .map(({ ref }) => ref)

  if (staleTokenRefs.length) {
    await Promise.all(staleTokenRefs.map((ref) => ref.delete()))
  }
}

exports.verifyPaystackPayment = onCall(
  {
    secrets: [paystackSecretKey],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in before verifying a payment.')
    }

    const paymentId = String(request.data?.paymentId || '').trim()
    const reference = String(request.data?.reference || '').trim()

    if (!paymentId || !reference) {
      throw new HttpsError('invalid-argument', 'Payment ID and Paystack reference are required.')
    }

    const paymentRef = db.collection('payments').doc(paymentId)
    const paymentSnapshot = await paymentRef.get()

    if (!paymentSnapshot.exists) {
      throw new HttpsError('not-found', 'The selected payment record was not found.')
    }

    const payment = paymentSnapshot.data()

    if (!payment) {
      throw new HttpsError('internal', 'The payment record could not be read.')
    }

    if (payment.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'You can only verify your own payment.')
    }

    if (payment.paystackReference !== reference) {
      throw new HttpsError(
        'invalid-argument',
        'The provided Paystack reference does not match the payment record.'
      )
    }

    if (payment.status === 'success' && payment.verificationMode === 'backend_verified') {
      return {
        payment: mapPaymentSnapshot(paymentSnapshot),
        gatewayStatus: String(payment.gatewayStatus || 'success').toLowerCase(),
      }
    }

    const { expectedAmount, bookingSnapshot } = await assertPaymentMatchesProperty(payment)

    const secret = paystackSecretKey.value()

    if (!secret) {
      throw new HttpsError(
        'failed-precondition',
        'PAYSTACK_SECRET_KEY is missing. Set the Firebase Functions secret before verifying payments.'
      )
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!verifyResponse.ok) {
      const body = await verifyResponse.text()
      throw new HttpsError('internal', `Paystack verification failed: ${body}`)
    }

    const verifyPayload = await verifyResponse.json()
    const gatewayData = verifyPayload?.data
    const gatewayStatus = String(gatewayData?.status || '').toLowerCase()
    const gatewayAmount = Number(gatewayData?.amount || 0)
    const gatewayCurrency = String(gatewayData?.currency || '').toUpperCase()
    const gatewayReference = String(gatewayData?.reference || '').trim()
    const gatewayCustomerEmail = String(gatewayData?.customer?.email || '')
      .trim()
      .toLowerCase()
    const metadataPaymentId = String(gatewayData?.metadata?.paymentId || '').trim()
    const expectedGatewayAmount = Math.round(expectedAmount * 100)
    const expectedEmail = String(payment.payerEmail || '')
      .trim()
      .toLowerCase()

    if (!gatewayData || gatewayReference !== reference) {
      throw new HttpsError(
        'failed-precondition',
        'Paystack returned an unexpected verification response.'
      )
    }

    if (gatewayAmount !== expectedGatewayAmount) {
      throw new HttpsError(
        'failed-precondition',
        `Amount mismatch. Expected ${expectedGatewayAmount} kobo but received ${gatewayAmount} kobo.`
      )
    }

    if (gatewayCurrency && gatewayCurrency !== 'NGN') {
      throw new HttpsError(
        'failed-precondition',
        `Currency mismatch. Expected NGN but received ${gatewayCurrency}.`
      )
    }

    if (expectedEmail && gatewayCustomerEmail && gatewayCustomerEmail !== expectedEmail) {
      throw new HttpsError(
        'failed-precondition',
        'Paystack customer email did not match the payment record email.'
      )
    }

    if (metadataPaymentId && metadataPaymentId !== paymentId) {
      throw new HttpsError(
        'failed-precondition',
        'Paystack metadata payment ID did not match the payment record.'
      )
    }

    const nextStatus = gatewayStatus === 'success' ? 'success' : 'failed'
    const verifiedAt =
      gatewayStatus === 'success' ? admin.firestore.FieldValue.serverTimestamp() : null

    await paymentRef.update({
      status: nextStatus,
      verificationMode: gatewayStatus === 'success' ? 'backend_verified' : 'backend_required',
      verifiedAt,
      gatewayStatus,
      gatewayCurrency: gatewayCurrency || 'NGN',
      gatewayAmount,
      gatewayReference,
      gatewayCustomerEmail: gatewayCustomerEmail || null,
      gatewayVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (gatewayStatus === 'success' && bookingSnapshot?.exists) {
      await bookingSnapshot.ref.update({
        paymentStatus: 'success',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    const updatedSnapshot = await paymentRef.get()

    return {
      payment: mapPaymentSnapshot(updatedSnapshot),
      gatewayStatus,
    }
  }
)

exports.createNotificationRecord = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in before creating notifications.')
  }

  const input = {
    userId: String(request.data?.userId || '').trim(),
    type: String(request.data?.type || '').trim(),
    title: String(request.data?.title || '').trim(),
    body: String(request.data?.body || '').trim(),
    channel: String(request.data?.channel || 'in_app').trim(),
    relatedPropertyId: request.data?.relatedPropertyId
      ? String(request.data.relatedPropertyId).trim()
      : null,
    relatedBookingId: request.data?.relatedBookingId
      ? String(request.data.relatedBookingId).trim()
      : null,
    relatedPaymentId: request.data?.relatedPaymentId
      ? String(request.data.relatedPaymentId).trim()
      : null,
  }

  if (!input.userId || !input.type || !input.title || !input.body) {
    throw new HttpsError(
      'invalid-argument',
      'Notification user, type, title, and body are required.'
    )
  }

  if (request.auth.uid !== input.userId) {
    throw new HttpsError(
      'permission-denied',
      'You can only create notifications for your own account.'
    )
  }

  if (
    ![
      'inspection_reminder',
      'booking_confirmation',
      'payment_confirmation',
      'rent_due_reminder',
      'admin_message',
    ].includes(input.type)
  ) {
    throw new HttpsError('invalid-argument', 'Unsupported notification type.')
  }

  if (!['in_app', 'browser'].includes(input.channel)) {
    throw new HttpsError('invalid-argument', 'Unsupported notification channel.')
  }

  const notification = await createNotificationDocument(input)

  return {
    notification,
  }
})

exports.runInspectionReminderScan = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in before running reminder scans.')
  }

  const bookingsSnapshot = await db
    .collection('bookings')
    .where('userId', '==', request.auth.uid)
    .where('reminderSent', '==', false)
    .get()

  const created = await processInspectionReminderSnapshots(bookingsSnapshot.docs)

  return {
    created,
  }
})

exports.processInspectionReminders = onSchedule(
  {
    schedule: 'every 60 minutes',
    timeZone: 'Africa/Lagos',
  },
  async () => {
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('reminderSent', '==', false)
      .get()

    const created = await processInspectionReminderSnapshots(bookingsSnapshot.docs)

    return {
      processed: bookingsSnapshot.size,
      created: created.length,
    }
  }
)
