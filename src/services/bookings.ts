import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { authMode, db, firebaseConfigError, functions, isFirebaseConfigured } from '../lib/firebase'
import { listPaymentsForUser } from './payments'
import { isInspectionMode, validateUniversalBookingInput } from './bookingModes'
import type { BookingInput, BookingMode, BookingPricingUnit, BookingRecord } from '../types/booking'
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
        'Firebase is not configured. Add your VITE_FIREBASE_* values before using bookings.'
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
    const parsed = JSON.parse(raw) as Array<Partial<BookingRecord> & { id?: string }>
    return Array.isArray(parsed)
      ? parsed.map((booking) => mapDocToBookingRecord(String(booking.id ?? ''), booking))
      : []
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

function normalizeBookingDateTime(date: string, time: string) {
  if (!date || !time) return ''
  const value = new Date(`${date}T${time}:00+01:00`)
  return Number.isNaN(value.getTime()) ? '' : value.toISOString()
}

function mapDocToBookingRecord(bookingId: string, data: DocumentData) {
  const inspectionDate = String(data.inspectionDate ?? '')
  const inspectionTime = String(data.inspectionTime ?? '')
  const durationMinutes = Math.max(1, Number(data.durationMinutes ?? 30))
  const startAt =
    normalizeTimestampLike(data.startAt) ?? normalizeBookingDateTime(inspectionDate, inspectionTime)
  const fallbackEnd = startAt
    ? new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString()
    : ''

  return {
    id: bookingId,
    userId: String(data.userId ?? ''),
    propertyId: String(data.propertyId ?? ''),
    listingId: String(data.listingId ?? data.propertyId ?? ''),
    agentId: String(data.agentId ?? ''),
    bookingMode: (data.bookingMode ?? 'property_inspection') as BookingMode,
    listingCategory: String(data.listingCategory ?? ''),
    inspectionDate,
    inspectionTime,
    startAt,
    endAt: normalizeTimestampLike(data.endAt) ?? fallbackEnd,
    durationMinutes,
    quantity: Math.max(1, Number(data.quantity ?? 1)),
    pricingUnit: (data.pricingUnit ?? 'per_inspection') as BookingPricingUnit,
    estimatedTotal:
      data.estimatedTotal === null || data.estimatedTotal === undefined
        ? null
        : Number(data.estimatedTotal),
    categoryDetails:
      data.categoryDetails && typeof data.categoryDetails === 'object' ? data.categoryDetails : {},
    status: data.status ?? 'pending',
    paymentStatus: data.paymentStatus ?? 'pending',
    reminderSent: Boolean(data.reminderSent),
    guestPhone: String(data.guestPhone ?? ''),
    notes: String(data.notes ?? ''),
    createdAt: normalizeTimestampLike(data.createdAt) ?? '',
    updatedAt:
      normalizeTimestampLike(data.updatedAt) ?? normalizeTimestampLike(data.createdAt) ?? '',
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

function buildLatestBookingPaymentMap(payments: PaymentRecord[]) {
  const map = new Map<string, PaymentRecord>()
  for (const payment of payments) {
    if (
      payment.paymentType === 'booking_payment' &&
      payment.bookingId &&
      !map.has(payment.bookingId)
    ) {
      map.set(payment.bookingId, payment)
    }
  }
  return map
}

async function applyDerivedPaymentStatuses(bookings: BookingRecord[], userId: string) {
  const payments = await listPaymentsForUser(userId)
  const latestPaymentMap = buildLatestInspectionPaymentMap(payments)
  const latestBookingPaymentMap = buildLatestBookingPaymentMap(payments)

  return bookings.map((booking) => {
    const latestPayment = isInspectionMode(booking.bookingMode)
      ? latestPaymentMap.get(`${booking.userId}:${booking.propertyId}`)
      : latestBookingPaymentMap.get(booking.id)

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
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(bookingsQuery)
  const bookings = snapshot.docs.map((bookingDoc) =>
    mapDocToBookingRecord(bookingDoc.id, bookingDoc.data())
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

export function validateBookingInput(input: BookingInput, property: PropertyRecord) {
  return validateUniversalBookingInput(input, property)
}

export async function createBooking(
  input: BookingInput,
  user: UserProfile,
  property: PropertyRecord
) {
  const selection = validateBookingInput(input, property)

  if (authMode !== 'local') {
    if (!functions) {
      throw new Error('Firebase Functions is not configured for secure booking creation.')
    }

    const callable = httpsCallable<
      BookingInput & { propertyId: string },
      { booking: BookingRecord }
    >(functions, 'createUniversalBooking')
    const result = await callable({ ...input, propertyId: property.id })
    return mapDocToBookingRecord(result.data.booking.id, result.data.booking)
  }

  const bookings = readBookings()

  const hasActiveBooking = bookings.some(
    (booking) =>
      isInspectionMode(selection.bookingMode) &&
      isInspectionMode(booking.bookingMode) &&
      booking.userId === user.uid &&
      booking.propertyId === property.id &&
      booking.status !== 'cancelled' &&
      booking.status !== 'completed'
  )

  if (hasActiveBooking) {
    throw new Error(
      'You already have an active inspection booking for this listing. Cancel it first if you need a new time.'
    )
  }

  const { findBookingConflict } = await import('./bookingAvailability')
  if (findBookingConflict(input, property, bookings)) {
    throw new Error('This time is no longer available. Please select another option.')
  }

  const latestInspectionPayment = (await listPaymentsForUser(user.uid)).find(
    (payment) => payment.propertyId === property.id && payment.paymentType === 'inspection_fee'
  )
  const now = new Date().toISOString()

  const booking: BookingRecord = {
    id: `booking-${crypto.randomUUID()}`,
    userId: user.uid,
    propertyId: property.id,
    listingId: property.id,
    agentId: property.ownerId,
    bookingMode: selection.bookingMode,
    listingCategory: property.propertyType,
    inspectionDate: input.inspectionDate,
    inspectionTime: input.inspectionTime,
    startAt: selection.startAt,
    endAt: selection.endAt,
    durationMinutes: selection.durationMinutes,
    quantity: selection.quantity,
    pricingUnit: selection.pricingUnit,
    estimatedTotal: selection.estimatedTotal,
    categoryDetails: input.categoryDetails,
    status: 'pending',
    paymentStatus: isInspectionMode(selection.bookingMode)
      ? (latestInspectionPayment?.status ?? 'pending')
      : 'pending',
    reminderSent: false,
    guestPhone: input.guestPhone.trim(),
    notes: input.notes.trim(),
    createdAt: now,
    updatedAt: now,
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

    return (
      (await getBookingById(bookingId)) ?? {
        ...current,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      }
    )
  }

  const bookings = readBookings()
  const index = bookings.findIndex(
    (booking) => booking.id === bookingId && booking.userId === userId
  )

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

    return (
      (await getBookingById(bookingId)) ?? {
        ...current,
        reminderSent: true,
        updatedAt: new Date().toISOString(),
      }
    )
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
    listingId: booking.listingId,
    agentId: booking.agentId,
    bookingMode: booking.bookingMode,
    listingCategory: booking.listingCategory,
    inspectionDate: booking.inspectionDate,
    inspectionTime: booking.inspectionTime,
    startAt: toTimestampOrServerValue(booking.startAt),
    endAt: toTimestampOrServerValue(booking.endAt),
    durationMinutes: booking.durationMinutes,
    quantity: booking.quantity,
    pricingUnit: booking.pricingUnit,
    estimatedTotal: booking.estimatedTotal,
    categoryDetails: booking.categoryDetails,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    reminderSent: booking.reminderSent,
    guestPhone: booking.guestPhone,
    notes: booking.notes,
    createdAt: toTimestampOrServerValue(booking.createdAt),
    updatedAt: toTimestampOrServerValue(booking.updatedAt),
  }
}
