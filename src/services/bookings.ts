import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'

import { authMode, db, firebaseConfigError, isFirebaseConfigured } from '../lib/firebase'
import { listPaymentsForUser } from './payments'
import type { BookingInput, BookingRecord } from '../types/booking'
import type { PaymentRecord } from '../types/payment'
import type { PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'

const LOCAL_BOOKINGS_KEY = 'randsa.local.bookings'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError ||
        'Firebase is not configured. Add your VITE_FIREBASE_* values before using bookings.',
    )
  }

  return db
}

function readBookings() {
  if (!canUseStorage()) {
    return [] as BookingRecord[]
  }

  const raw = window.localStorage.getItem(LOCAL_BOOKINGS_KEY)

  if (!raw) {
    return [] as BookingRecord[]
  }

  try {
    return JSON.parse(raw) as BookingRecord[]
  } catch {
    return [] as BookingRecord[]
  }
}

function writeBookings(bookings: BookingRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(bookings))
}

function sortBookings(bookings: BookingRecord[]) {
  return [...bookings].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function normalizeTimestampLike(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }

  return value ? String(value) : null
}

function mapDocToBookingRecord(bookingId: string, data: DocumentData) {
  return {
    id: bookingId,
    userId: String(data.userId ?? ''),
    propertyId: String(data.propertyId ?? ''),
    agentId: String(data.agentId ?? ''),
    inspectionDate: String(data.inspectionDate ?? ''),
    inspectionTime: String(data.inspectionTime ?? ''),
    status: data.status ?? 'pending',
    paymentStatus: data.paymentStatus ?? 'pending',
    reminderSent: Boolean(data.reminderSent),
    guestPhone: String(data.guestPhone ?? ''),
    notes: String(data.notes ?? ''),
    createdAt: normalizeTimestampLike(data.createdAt) ?? '',
    updatedAt: normalizeTimestampLike(data.updatedAt) ?? normalizeTimestampLike(data.createdAt) ?? '',
  } satisfies BookingRecord
}

function buildLatestInspectionPaymentMap(payments: PaymentRecord[]) {
  const map = new Map<string, PaymentRecord>()

  for (const payment of payments) {
    if (payment.paymentType !== 'inspection_fee') {
      continue
    }

    const key = `${payment.userId}:${payment.propertyId}`

    if (!map.has(key)) {
      map.set(key, payment)
    }
  }

  return map
}

async function applyDerivedPaymentStatuses(bookings: BookingRecord[], userId: string) {
  const payments = await listPaymentsForUser(userId)
  const latestPaymentMap = buildLatestInspectionPaymentMap(payments)

  return bookings.map((booking) => {
    const latestPayment = latestPaymentMap.get(`${booking.userId}:${booking.propertyId}`)

    return latestPayment
      ? {
          ...booking,
          paymentStatus: latestPayment.status,
        }
      : booking
  })
}

function toTimestampOrServerValue(value: string) {
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? serverTimestamp() : Timestamp.fromDate(parsedDate)
}

export function listAllLocalBookings() {
  return sortBookings(readBookings())
}

export async function listBookingsForUser(userId: string) {
  if (authMode === 'local') {
    return sortBookings(readBookings().filter((booking) => booking.userId === userId))
  }

  const firestore = ensureFirestoreReady()
  const bookingsQuery = query(
    collection(firestore, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(bookingsQuery)
  const bookings = snapshot.docs.map((bookingDoc) =>
    mapDocToBookingRecord(bookingDoc.id, bookingDoc.data()),
  )

  return applyDerivedPaymentStatuses(bookings, userId)
}

export async function getBookingById(bookingId: string) {
  if (authMode === 'local') {
    return readBookings().find((booking) => booking.id === bookingId) ?? null
  }

  const firestore = ensureFirestoreReady()
  const snapshot = await getDoc(doc(firestore, 'bookings', bookingId))

  if (!snapshot.exists()) {
    return null
  }

  const booking = mapDocToBookingRecord(snapshot.id, snapshot.data())
  const [hydratedBooking] = await applyDerivedPaymentStatuses([booking], booking.userId)
  return hydratedBooking ?? booking
}

export function validateBookingInput(input: BookingInput) {
  if (!input.inspectionDate) {
    throw new Error('Select an inspection date before saving the booking.')
  }

  if (!input.inspectionTime) {
    throw new Error('Select an inspection time before saving the booking.')
  }

  if (!input.guestPhone.trim()) {
    throw new Error('Add a phone number for the inspection booking.')
  }
}

export async function createBooking(input: BookingInput, user: UserProfile, property: PropertyRecord) {
  validateBookingInput(input)

  const bookings =
    authMode === 'local'
      ? readBookings()
      : await listBookingsForUser(user.uid)

  const hasActiveBooking = bookings.some(
    (booking) =>
      booking.userId === user.uid &&
      booking.propertyId === property.id &&
      booking.status !== 'cancelled' &&
      booking.status !== 'completed',
  )

  if (hasActiveBooking) {
    throw new Error(
      'You already have an active inspection booking for this property. Cancel it first if you need a new time.',
    )
  }

  const latestInspectionPayment = (await listPaymentsForUser(user.uid)).find(
    (payment) => payment.propertyId === property.id && payment.paymentType === 'inspection_fee',
  )
  const now = new Date().toISOString()

  const booking: BookingRecord = {
    id: `booking-${crypto.randomUUID()}`,
    userId: user.uid,
    propertyId: property.id,
    agentId: property.ownerId,
    inspectionDate: input.inspectionDate,
    inspectionTime: input.inspectionTime,
    status: 'pending',
    paymentStatus: latestInspectionPayment?.status ?? 'pending',
    reminderSent: false,
    guestPhone: input.guestPhone.trim(),
    notes: input.notes.trim(),
    createdAt: now,
    updatedAt: now,
  }

  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    await setDoc(doc(firestore, 'bookings', booking.id), {
      userId: booking.userId,
      propertyId: booking.propertyId,
      agentId: booking.agentId,
      inspectionDate: booking.inspectionDate,
      inspectionTime: booking.inspectionTime,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      reminderSent: booking.reminderSent,
      guestPhone: booking.guestPhone,
      notes: booking.notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return (await getBookingById(booking.id)) ?? booking
  }

  writeBookings([booking, ...bookings])
  return booking
}

export async function cancelBooking(bookingId: string, userId: string) {
  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    const current = await getBookingById(bookingId)

    if (!current || current.userId !== userId) {
      throw new Error('The selected booking was not found.')
    }

    if (current.status === 'cancelled') {
      return current
    }

    await updateDoc(doc(firestore, 'bookings', bookingId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    })

    return (await getBookingById(bookingId)) ?? {
      ...current,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    }
  }

  const bookings = readBookings()
  const index = bookings.findIndex((booking) => booking.id === bookingId && booking.userId === userId)

  if (index === -1) {
    throw new Error('The selected booking was not found.')
  }

  const current = bookings[index]

  if (current.status === 'cancelled') {
    return current
  }

  const nextBooking: BookingRecord = {
    ...current,
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  }

  bookings[index] = nextBooking
  writeBookings(bookings)
  return nextBooking
}

export async function markBookingReminderSent(bookingId: string) {
  if (authMode !== 'local') {
    const firestore = ensureFirestoreReady()
    const current = await getBookingById(bookingId)

    if (!current) {
      throw new Error('The selected booking was not found.')
    }

    if (current.reminderSent) {
      return current
    }

    await updateDoc(doc(firestore, 'bookings', bookingId), {
      reminderSent: true,
      updatedAt: serverTimestamp(),
    })

    return (await getBookingById(bookingId)) ?? {
      ...current,
      reminderSent: true,
      updatedAt: new Date().toISOString(),
    }
  }

  const bookings = readBookings()
  const index = bookings.findIndex((booking) => booking.id === bookingId)

  if (index === -1) {
    throw new Error('The selected booking was not found.')
  }

  const current = bookings[index]

  const nextBooking: BookingRecord = {
    ...current,
    reminderSent: true,
    updatedAt: new Date().toISOString(),
  }

  bookings[index] = nextBooking
  writeBookings(bookings)
  return nextBooking
}

export function buildFirestoreBookingPayload(booking: BookingRecord) {
  return {
    userId: booking.userId,
    propertyId: booking.propertyId,
    agentId: booking.agentId,
    inspectionDate: booking.inspectionDate,
    inspectionTime: booking.inspectionTime,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    reminderSent: booking.reminderSent,
    guestPhone: booking.guestPhone,
    notes: booking.notes,
    createdAt: toTimestampOrServerValue(booking.createdAt),
    updatedAt: toTimestampOrServerValue(booking.updatedAt),
  }
}
