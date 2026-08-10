import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'

import { authMode, db, firebaseConfigError, functions, isFirebaseConfigured } from '../lib/firebase'
import { isLocalPaymentBypassEnabled } from '../lib/payments'
import type { PropertyRecord } from '../types/property'
import type {
  VerifyPaymentResult,
  PaymentInitializationResult,
  PaymentRecord,
  PaymentStatus,
  PaymentType,
} from '../types/payment'
import type { UserProfile } from '../types/user'

const LOCAL_PAYMENTS_KEY = 'randsa.local.payments'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readPayments() {
  if (!canUseStorage()) {
    return [] as PaymentRecord[]
  }

  const raw = window.localStorage.getItem(LOCAL_PAYMENTS_KEY)

  if (!raw) {
    return [] as PaymentRecord[]
  }

  try {
    return JSON.parse(raw) as PaymentRecord[]
  } catch {
    return [] as PaymentRecord[]
  }
}

function writePayments(payments: PaymentRecord[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(payments))
}

function createPaymentReference() {
  return `RANDSA-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
}

function sortPayments(payments: PaymentRecord[]) {
  return [...payments].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function ensureFirestoreReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      firebaseConfigError ||
        'Firebase is not configured. Add your VITE_FIREBASE_* values before using payments.'
    )
  }

  return db
}

function ensureFunctionsReady() {
  if (!functions) {
    throw new Error(
      'Firebase Functions is not configured yet. Add your Firebase app config before verifying payments.'
    )
  }

  return functions
}

function normalizeTimestampLike(value: unknown) {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString()
  }

  return value ? String(value) : null
}

function mapDocToPaymentRecord(
  paymentId: string,
  data: Partial<PaymentRecord> & {
    createdAt?: unknown
    verifiedAt?: unknown
    gatewayVerifiedAt?: unknown
    gatewayInitializedAt?: unknown
  }
) {
  const createdAt = normalizeTimestampLike(data.createdAt) ?? ''
  const verifiedAt = normalizeTimestampLike(data.verifiedAt)
  const gatewayVerifiedAt = normalizeTimestampLike(data.gatewayVerifiedAt)
  const gatewayInitializedAt = normalizeTimestampLike(data.gatewayInitializedAt)

  return {
    id: paymentId,
    userId: data.userId ?? '',
    propertyId: data.propertyId ?? '',
    bookingId: data.bookingId ? String(data.bookingId) : null,
    agentId: data.agentId ?? '',
    propertyTitle: data.propertyTitle ?? '',
    payerName: data.payerName ?? '',
    payerEmail: data.payerEmail ?? '',
    amount: Number(data.amount ?? 0),
    paymentType: (data.paymentType ?? 'inspection_fee') as PaymentType,
    paystackReference: data.paystackReference ?? '',
    status: (data.status ?? 'pending') as PaymentStatus,
    verificationMode: (data.verificationMode ??
      'backend_required') as PaymentRecord['verificationMode'],
    createdAt,
    verifiedAt,
    gatewayStatus: data.gatewayStatus ? String(data.gatewayStatus) : null,
    gatewayVerifiedAt,
    gatewayAccessCode: data.gatewayAccessCode ? String(data.gatewayAccessCode) : null,
    gatewayAuthorizationUrl: data.gatewayAuthorizationUrl
      ? String(data.gatewayAuthorizationUrl)
      : null,
    gatewayInitializedAt,
  } satisfies PaymentRecord
}

function buildPaymentCallbackUrl(payment: Pick<PaymentRecord, 'id' | 'propertyId' | 'bookingId'>) {
  if (typeof window === 'undefined') {
    throw new Error('Paystack checkout can only be initialized in the browser.')
  }

  const callbackUrl = new URL(
    `/payment/${encodeURIComponent(payment.propertyId)}`,
    window.location.origin
  )
  callbackUrl.searchParams.set('paymentId', payment.id)
  if (payment.bookingId) callbackUrl.searchParams.set('bookingId', payment.bookingId)
  return callbackUrl.toString()
}

async function initializePaymentWithBackend(payment: PaymentRecord) {
  const functionsInstance = ensureFunctionsReady()
  const initializePaystackPayment = httpsCallable<
    {
      paymentId: string
      propertyId: string
      bookingId: string | null
      paymentType: PaymentType
      amount: number
      callbackUrl: string
    },
    PaymentInitializationResult
  >(functionsInstance, 'initializePaystackPayment')

  const result = await initializePaystackPayment({
    paymentId: payment.id,
    propertyId: payment.propertyId,
    bookingId: payment.bookingId,
    paymentType: payment.paymentType,
    amount: payment.amount,
    callbackUrl: buildPaymentCallbackUrl(payment),
  })
  return result.data
}

async function getPaymentsByQuery(constraints: ReturnType<typeof where>[]) {
  const firestore = ensureFirestoreReady()
  const paymentQuery = query(
    collection(firestore, 'payments'),
    ...constraints,
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(paymentQuery)
  return snapshot.docs.map((paymentDoc) =>
    mapDocToPaymentRecord(paymentDoc.id, paymentDoc.data() as Partial<PaymentRecord>)
  )
}

export async function listPaymentsForUser(userId: string) {
  if (authMode === 'local') {
    return sortPayments(readPayments().filter((payment) => payment.userId === userId))
  }

  return getPaymentsByQuery([where('userId', '==', userId)])
}

export async function listPaymentsForProperty(propertyId: string) {
  if (authMode === 'local') {
    return sortPayments(readPayments().filter((payment) => payment.propertyId === propertyId))
  }

  return getPaymentsByQuery([where('propertyId', '==', propertyId)])
}

export async function listPaymentsForUserAndProperty(userId: string, propertyId: string) {
  if (authMode === 'local') {
    return sortPayments(
      readPayments().filter(
        (payment) => payment.userId === userId && payment.propertyId === propertyId
      )
    )
  }

  return getPaymentsByQuery([where('userId', '==', userId), where('propertyId', '==', propertyId)])
}

export async function findLatestPaymentForUserProperty(
  userId: string,
  propertyId: string,
  paymentType?: PaymentType
) {
  const payments = await listPaymentsForUserAndProperty(userId, propertyId)
  return paymentType
    ? (payments.find((payment) => payment.paymentType === paymentType) ?? null)
    : (payments[0] ?? null)
}

export async function getPaymentById(paymentId: string) {
  if (authMode === 'local') {
    return readPayments().find((payment) => payment.id === paymentId) ?? null
  }

  const firestore = ensureFirestoreReady()
  const snapshot = await getDoc(doc(firestore, 'payments', paymentId))
  return snapshot.exists()
    ? mapDocToPaymentRecord(snapshot.id, snapshot.data() as Partial<PaymentRecord>)
    : null
}

export async function createPaymentRecord(
  user: UserProfile,
  property: PropertyRecord,
  paymentType: PaymentType,
  amount: number,
  bookingId: string | null = null
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than zero.')
  }

  if (!user.email.trim()) {
    throw new Error('Your profile needs a valid email address before starting Paystack checkout.')
  }

  const now = new Date().toISOString()
  const paymentId = `payment-${crypto.randomUUID()}`
  const record: PaymentRecord = {
    id: paymentId,
    userId: user.uid,
    propertyId: property.id,
    bookingId,
    agentId: property.ownerId,
    propertyTitle: property.title,
    payerName: user.fullName,
    payerEmail: user.email,
    amount,
    paymentType,
    paystackReference: createPaymentReference(),
    status: 'pending',
    verificationMode: isLocalPaymentBypassEnabled ? 'local_bypass' : 'backend_required',
    createdAt: now,
    verifiedAt: null,
    gatewayStatus: null,
    gatewayVerifiedAt: null,
    gatewayAccessCode: null,
    gatewayAuthorizationUrl: null,
    gatewayInitializedAt: null,
  }

  if (authMode === 'local') {
    const payments = readPayments()
    writePayments([record, ...payments])
    return record
  }

  return (await initializePaymentWithBackend(record)).payment
}

export async function preparePaymentCheckout(payment: PaymentRecord) {
  if (authMode === 'local') {
    throw new Error('Paystack checkout is unavailable while local payment bypass is active.')
  }
  return initializePaymentWithBackend(payment)
}

export async function completeLocalPayment(
  paymentId: string,
  userId: string,
  status: Extract<PaymentStatus, 'success' | 'failed'>
) {
  if (!isLocalPaymentBypassEnabled) {
    throw new Error(
      'Local payment completion is disabled. The next step is wiring real backend verification with Paystack.'
    )
  }

  const payments = readPayments()
  const targetIndex = payments.findIndex(
    (payment) => payment.id === paymentId && payment.userId === userId
  )

  if (targetIndex === -1) {
    throw new Error('The selected payment record was not found.')
  }

  const current = payments[targetIndex]
  const nextRecord: PaymentRecord = {
    ...current,
    status,
    verifiedAt: status === 'success' ? new Date().toISOString() : null,
    gatewayStatus: status,
    gatewayVerifiedAt: new Date().toISOString(),
  }

  payments[targetIndex] = nextRecord
  writePayments(payments)
  return nextRecord
}

export async function verifyPaymentWithBackend(paymentId: string, reference: string) {
  if (authMode === 'local') {
    throw new Error(
      'Backend payment verification is unavailable while local payment bypass is active.'
    )
  }

  const functionsInstance = ensureFunctionsReady()
  const verifyPaystackPayment = httpsCallable<
    { paymentId: string; reference: string },
    VerifyPaymentResult
  >(functionsInstance, 'verifyPaystackPayment')

  const result = await verifyPaystackPayment({
    paymentId,
    reference,
  })

  return result.data.payment
}
