const admin = require('firebase-admin')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')

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
  const expectedAmount = getExpectedPaymentAmount(property, paymentType)
  const recordedAmount = Number(payment.amount || 0)

  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    throw new HttpsError('failed-precondition', 'The selected payment type is not configured for this property.')
  }

  if (recordedAmount !== expectedAmount) {
    throw new HttpsError(
      'failed-precondition',
      `Payment amount mismatch. Expected ${expectedAmount} NGN for ${paymentType} but received ${recordedAmount} NGN.`,
    )
  }

  if (payment.agentId && property.ownerId && String(payment.agentId) !== String(property.ownerId)) {
    throw new HttpsError('failed-precondition', 'Payment agent did not match the property owner.')
  }

  return { property, expectedAmount }
}

function sanitizeIdSegment(value) {
  return String(value || 'none').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'none'
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
  const tokensSnapshot = await db.collection('users').doc(userId).collection('tokens').limit(1).get()
  return tokensSnapshot.empty ? 'in_app' : 'browser'
}

function isBookingEligibleForReminder(data) {
  return data && data.reminderSent !== true && data.status !== 'cancelled' && data.status !== 'completed'
}

function getTimeUntilInspectionMs(data) {
  if (!data?.inspectionDate || !data?.inspectionTime) {
    return Number.POSITIVE_INFINITY
  }

  return new Date(`${data.inspectionDate}T${data.inspectionTime}`).getTime() - Date.now()
}

async function processInspectionReminderSnapshots(bookingSnapshots) {
  const created = []

  for (const bookingSnapshot of bookingSnapshots) {
    const data = bookingSnapshot.data() || {}

    if (!isBookingEligibleForReminder(data)) {
      continue
    }

    const timeUntilInspection = getTimeUntilInspectionMs(data)

    if (!Number.isFinite(timeUntilInspection) || timeUntilInspection < 0 || timeUntilInspection > 24 * 60 * 60 * 1000) {
      continue
    }

    let propertyTitle = 'your property inspection'

    if (data.propertyId) {
      const propertySnapshot = await db.collection('properties').doc(String(data.propertyId)).get()
      propertyTitle = propertySnapshot.data()?.title || propertyTitle
    }

    const channel = await getNotificationChannelForUser(String(data.userId || ''))
    const notification = await createNotificationDocument({
      userId: String(data.userId || ''),
      type: 'inspection_reminder',
      title: 'Inspection reminder',
      body: `Your visit for ${propertyTitle} is within the next 24 hours.`,
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
      return code.includes('registration-token-not-registered') || code.includes('invalid-registration-token')
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
      throw new HttpsError('invalid-argument', 'The provided Paystack reference does not match the payment record.')
    }

    if (payment.status === 'success' && payment.verificationMode === 'backend_verified') {
      return {
        payment: mapPaymentSnapshot(paymentSnapshot),
        gatewayStatus: String(payment.gatewayStatus || 'success').toLowerCase(),
      }
    }

    const { expectedAmount } = await assertPaymentMatchesProperty(payment)

    const secret = paystackSecretKey.value()

    if (!secret) {
      throw new HttpsError(
        'failed-precondition',
        'PAYSTACK_SECRET_KEY is missing. Set the Firebase Functions secret before verifying payments.',
      )
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    })

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
    const gatewayCustomerEmail = String(gatewayData?.customer?.email || '').trim().toLowerCase()
    const metadataPaymentId = String(gatewayData?.metadata?.paymentId || '').trim()
    const expectedGatewayAmount = Math.round(expectedAmount * 100)
    const expectedEmail = String(payment.payerEmail || '').trim().toLowerCase()

    if (!gatewayData || gatewayReference !== reference) {
      throw new HttpsError('failed-precondition', 'Paystack returned an unexpected verification response.')
    }

    if (gatewayAmount !== expectedGatewayAmount) {
      throw new HttpsError(
        'failed-precondition',
        `Amount mismatch. Expected ${expectedGatewayAmount} kobo but received ${gatewayAmount} kobo.`,
      )
    }

    if (gatewayCurrency && gatewayCurrency !== 'NGN') {
      throw new HttpsError(
        'failed-precondition',
        `Currency mismatch. Expected NGN but received ${gatewayCurrency}.`,
      )
    }

    if (expectedEmail && gatewayCustomerEmail && gatewayCustomerEmail !== expectedEmail) {
      throw new HttpsError(
        'failed-precondition',
        'Paystack customer email did not match the payment record email.',
      )
    }

    if (metadataPaymentId && metadataPaymentId !== paymentId) {
      throw new HttpsError(
        'failed-precondition',
        'Paystack metadata payment ID did not match the payment record.',
      )
    }

    const nextStatus = gatewayStatus === 'success' ? 'success' : 'failed'
    const verifiedAt = gatewayStatus === 'success' ? admin.firestore.FieldValue.serverTimestamp() : null

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

    const updatedSnapshot = await paymentRef.get()

    return {
      payment: mapPaymentSnapshot(updatedSnapshot),
      gatewayStatus,
    }
  },
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
    relatedPropertyId: request.data?.relatedPropertyId ? String(request.data.relatedPropertyId).trim() : null,
    relatedBookingId: request.data?.relatedBookingId ? String(request.data.relatedBookingId).trim() : null,
    relatedPaymentId: request.data?.relatedPaymentId ? String(request.data.relatedPaymentId).trim() : null,
  }

  if (!input.userId || !input.type || !input.title || !input.body) {
    throw new HttpsError('invalid-argument', 'Notification user, type, title, and body are required.')
  }

  if (request.auth.uid !== input.userId) {
    throw new HttpsError('permission-denied', 'You can only create notifications for your own account.')
  }

  if (!['inspection_reminder', 'booking_confirmation', 'payment_confirmation', 'rent_due_reminder', 'admin_message'].includes(input.type)) {
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
  },
)
