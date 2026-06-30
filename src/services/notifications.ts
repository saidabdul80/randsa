import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { auth, authMode, db, firebaseConfigError, functions, isFirebaseConfigured } from '../lib/firebase'
import { requestFirebaseMessagingToken } from '../lib/messaging'
import { getPropertyById } from './properties'
import { listBookingsForUser, markBookingReminderSent } from './bookings'
import { getInspectionDateTime, type BookingRecord } from '../types/booking'
import type { NotificationRecord, NotificationTokenRecord } from '../types/notification'
import type { PaymentRecord } from '../types/payment'
import type { PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'

const LOCAL_NOTIFICATIONS_KEY = 'randsa.local.notifications'
const LOCAL_NOTIFICATION_TOKENS_KEY = 'randsa.local.notification-tokens'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function supportsBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError ||
        'Firebase is not configured. Add your VITE_FIREBASE_* values before using notifications.',
    )
  }

  return db
}

function ensureFunctionsReady() {
  if (!functions) {
    throw new Error(
      'Firebase Functions is not configured yet. Add your Firebase app config before sending notifications.',
    )
  }

  return functions
}

function ensureSignedInUserMatchesTarget(userId: string) {
  const currentUserId = auth?.currentUser?.uid

  if (currentUserId && currentUserId !== userId) {
    throw new Error('You can only run reminder scans for the signed-in account.')
  }
}

function readNotifications() {
  if (!canUseStorage()) {
    return [] as NotificationRecord[]
  }

  const raw = window.localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)

  if (!raw) {
    return [] as NotificationRecord[]
  }

  try {
    return JSON.parse(raw) as NotificationRecord[]
  } catch {
    return [] as NotificationRecord[]
  }
}

function writeNotifications(notifications: NotificationRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications))
}

function readNotificationTokens() {
  if (!canUseStorage()) {
    return [] as NotificationTokenRecord[]
  }

  const raw = window.localStorage.getItem(LOCAL_NOTIFICATION_TOKENS_KEY)

  if (!raw) {
    return [] as NotificationTokenRecord[]
  }

  try {
    return JSON.parse(raw) as NotificationTokenRecord[]
  } catch {
    return [] as NotificationTokenRecord[]
  }
}

function writeNotificationTokens(tokens: NotificationTokenRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_NOTIFICATION_TOKENS_KEY, JSON.stringify(tokens))
}

function sortNotifications(notifications: NotificationRecord[]) {
  return [...notifications].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function getDeviceLabel() {
  if (typeof navigator === 'undefined') {
    return 'Unknown device'
  }

  return navigator.userAgent
}

function maybeShowBrowserNotification(title: string, body: string) {
  if (!supportsBrowserNotifications() || window.Notification.permission !== 'granted') {
    return
  }

  const notification = new window.Notification(title, { body })
  window.setTimeout(() => notification.close(), 7000)
}

function hasDuplicateNotification(
  notifications: NotificationRecord[],
  candidate: Pick<
    NotificationRecord,
    'userId' | 'type' | 'relatedBookingId' | 'relatedPaymentId' | 'relatedPropertyId'
  >,
) {
  return notifications.some(
    (notification) =>
      notification.userId === candidate.userId &&
      notification.type === candidate.type &&
      notification.relatedBookingId === candidate.relatedBookingId &&
      notification.relatedPaymentId === candidate.relatedPaymentId &&
      notification.relatedPropertyId === candidate.relatedPropertyId,
  )
}

function toIsoString(value: unknown) {
  return value && typeof value === 'object' && value !== null && 'toDate' in value
    ? (value as { toDate: () => Date }).toDate().toISOString()
    : value
      ? String(value)
      : null
}

function mapFirestoreNotificationRecord(
  notificationId: string,
  data: Partial<NotificationRecord> & {
    createdAt?: unknown
    deliveredAt?: unknown
    readAt?: unknown
  },
) {
  return {
    id: notificationId,
    userId: data.userId ?? '',
    type: data.type ?? 'admin_message',
    title: data.title ?? '',
    body: data.body ?? '',
    channel: data.channel ?? 'in_app',
    relatedPropertyId: data.relatedPropertyId ?? null,
    relatedBookingId: data.relatedBookingId ?? null,
    relatedPaymentId: data.relatedPaymentId ?? null,
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
    deliveredAt: toIsoString(data.deliveredAt),
    readAt: toIsoString(data.readAt),
  } satisfies NotificationRecord
}

function mapFirestoreNotificationTokenRecord(
  tokenId: string,
  userId: string,
  data: Partial<NotificationTokenRecord> & {
    createdAt?: unknown
  },
) {
  return {
    id: tokenId,
    userId,
    token: data.token ?? '',
    device: data.device ?? '',
    createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
  } satisfies NotificationTokenRecord
}

export async function listNotificationsForUser(userId: string) {
  if (authMode === 'local') {
    return sortNotifications(readNotifications().filter((notification) => notification.userId === userId))
  }

  const firestore = ensureFirestoreReady()
  const notificationsQuery = query(
    collection(firestore, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(notificationsQuery)
  return snapshot.docs.map((notificationDoc) =>
    mapFirestoreNotificationRecord(notificationDoc.id, notificationDoc.data() as Partial<NotificationRecord>),
  )
}

export async function listNotificationTokensForUser(userId: string) {
  if (authMode === 'local') {
    return readNotificationTokens().filter((token) => token.userId === userId)
  }

  const firestore = ensureFirestoreReady()
  const tokensQuery = query(collection(firestore, 'users', userId, 'tokens'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(tokensQuery)
  return snapshot.docs.map((tokenDoc) =>
    mapFirestoreNotificationTokenRecord(
      tokenDoc.id,
      userId,
      tokenDoc.data() as Partial<NotificationTokenRecord>,
    ),
  )
}

export async function requestBrowserNotificationPermission() {
  if (!supportsBrowserNotifications()) {
    throw new Error('Browser notifications are not supported on this device.')
  }

  return window.Notification.requestPermission()
}

export async function registerNotificationToken(userId: string) {
  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    const tokenValue = await requestFirebaseMessagingToken()
    const device = getDeviceLabel()
    const tokenCollection = collection(firestore, 'users', userId, 'tokens')
    const existingSnapshot = await getDocs(query(tokenCollection, where('token', '==', tokenValue)))

    if (!existingSnapshot.empty) {
      const existing = existingSnapshot.docs[0]
      return mapFirestoreNotificationTokenRecord(
        existing.id,
        userId,
        existing.data() as Partial<NotificationTokenRecord>,
      )
    }

    const tokenId = `token-${crypto.randomUUID()}`
    const tokenRef = doc(firestore, 'users', userId, 'tokens', tokenId)
    await setDoc(tokenRef, {
      userId,
      token: tokenValue,
      device,
      createdAt: serverTimestamp(),
    })

    const createdSnapshot = await getDoc(tokenRef)
    return mapFirestoreNotificationTokenRecord(
      createdSnapshot.id,
      userId,
      createdSnapshot.data() as Partial<NotificationTokenRecord>,
    )
  }

  const tokens = readNotificationTokens()
  const device = getDeviceLabel()
  const existing = tokens.find((token) => token.userId === userId && token.device === device)

  if (existing) {
    return existing
  }

  const record: NotificationTokenRecord = {
    id: `token-${crypto.randomUUID()}`,
    userId,
    token: `local-fcm-${crypto.randomUUID()}`,
    device,
    createdAt: new Date().toISOString(),
  }

  writeNotificationTokens([record, ...tokens])
  return record
}

export async function createNotificationRecord(
  input: Omit<NotificationRecord, 'id' | 'createdAt' | 'deliveredAt' | 'readAt'>,
) {
  if (authMode !== 'local') {
    const functionsInstance = ensureFunctionsReady()
    const createNotification = httpsCallable<
      Omit<NotificationRecord, 'id' | 'createdAt' | 'deliveredAt' | 'readAt'>,
      { notification: NotificationRecord }
    >(functionsInstance, 'createNotificationRecord')
    const result = await createNotification(input)
    return result.data.notification
  }

  const notifications = readNotifications()

  if (hasDuplicateNotification(notifications, input)) {
    return notifications.find(
      (notification) =>
        notification.userId === input.userId &&
        notification.type === input.type &&
        notification.relatedBookingId === input.relatedBookingId &&
        notification.relatedPaymentId === input.relatedPaymentId &&
        notification.relatedPropertyId === input.relatedPropertyId,
    )!
  }

  const now = new Date().toISOString()
  const notification: NotificationRecord = {
    ...input,
    id: `notification-${crypto.randomUUID()}`,
    createdAt: now,
    deliveredAt: now,
    readAt: null,
  }

  writeNotifications([notification, ...notifications])

  if (input.channel === 'browser') {
    maybeShowBrowserNotification(input.title, input.body)
  }

  return notification
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    const notificationRef = doc(firestore, 'notifications', notificationId)
    await updateDoc(notificationRef, {
      readAt: serverTimestamp(),
    })

    const snapshot = await getDoc(notificationRef)

    if (!snapshot.exists()) {
      throw new Error('The selected notification was not found.')
    }

    const notification = mapFirestoreNotificationRecord(
      snapshot.id,
      snapshot.data() as Partial<NotificationRecord>,
    )

    if (notification.userId !== userId) {
      throw new Error('You can only mark your own notifications as read.')
    }

    return notification
  }

  const notifications = readNotifications()
  const index = notifications.findIndex(
    (notification) => notification.id === notificationId && notification.userId === userId,
  )

  if (index === -1) {
    throw new Error('The selected notification was not found.')
  }

  const current = notifications[index]

  if (current.readAt) {
    return current
  }

  const nextNotification: NotificationRecord = {
    ...current,
    readAt: new Date().toISOString(),
  }

  notifications[index] = nextNotification
  writeNotifications(notifications)
  return nextNotification
}

export async function createBookingConfirmationNotification(
  user: UserProfile,
  booking: BookingRecord,
  property: PropertyRecord,
) {
  return createNotificationRecord({
    userId: user.uid,
    type: 'booking_confirmation',
    title: 'Inspection booking created',
    body: `Your inspection for ${property.title} is scheduled for ${booking.inspectionDate} at ${booking.inspectionTime}.`,
    channel: 'in_app',
    relatedPropertyId: property.id,
    relatedBookingId: booking.id,
    relatedPaymentId: null,
  })
}

export async function createPaymentConfirmationNotification(user: UserProfile, payment: PaymentRecord) {
  return createNotificationRecord({
    userId: user.uid,
    type: 'payment_confirmation',
    title: payment.status === 'success' ? 'Payment confirmed' : 'Payment update',
    body:
      payment.status === 'success'
        ? `${payment.propertyTitle} payment was confirmed successfully.`
        : `${payment.propertyTitle} payment is currently marked as ${payment.status}.`,
    channel: 'in_app',
    relatedPropertyId: payment.propertyId,
    relatedBookingId: null,
    relatedPaymentId: payment.id,
  })
}

export async function runInspectionReminderScan(userId: string) {
  if (authMode !== 'local') {
    ensureSignedInUserMatchesTarget(userId)
    const functionsInstance = ensureFunctionsReady()
    const runInspectionReminderScanCallable = httpsCallable<
      Record<string, never>,
      { created: NotificationRecord[] }
    >(functionsInstance, 'runInspectionReminderScan')
    const result = await runInspectionReminderScanCallable({})
    return result.data.created
  }

  const bookings = await listBookingsForUser(userId)
  const now = Date.now()
  const delivered: NotificationRecord[] = []

  for (const booking of bookings) {
    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.reminderSent) {
      continue
    }

    const inspectionTime = getInspectionDateTime(booking).getTime()
    const timeUntilInspection = inspectionTime - now

    if (timeUntilInspection < 0 || timeUntilInspection > 24 * 60 * 60 * 1000) {
      continue
    }

    const property = await getPropertyById(booking.propertyId)
    const title = property?.title ?? 'your property inspection'
    const notification = await createNotificationRecord({
      userId,
      type: 'inspection_reminder',
      title: 'Inspection reminder',
      body: `Your visit for ${title} is within the next 24 hours.`,
      channel:
        supportsBrowserNotifications() && window.Notification.permission === 'granted'
          ? 'browser'
          : 'in_app',
      relatedPropertyId: booking.propertyId,
      relatedBookingId: booking.id,
      relatedPaymentId: null,
    })

    await markBookingReminderSent(booking.id)
    delivered.push(notification)
  }

  return delivered
}
