const nodeCrypto = require('node:crypto')

const PAYMENT_TYPES = [
  'inspection_fee',
  'rent_deposit',
  'full_rent_payment',
  'service_fee',
  'booking_payment',
]

const PRODUCTION_CALLBACK_ORIGINS = new Set([
  'https://randsa-67e93.web.app',
  'https://randsa-67e93.firebaseapp.com',
])

function getExpectedPaymentAmount(property, paymentType) {
  if (paymentType === 'inspection_fee') return Number(property.inspectionFee || 0)
  if (paymentType === 'rent_deposit') return Number(property.cautionFee || 0)
  if (paymentType === 'service_fee') return Number(property.agencyFee || 0)
  if (paymentType === 'full_rent_payment') return Number(property.rentPrice || 0)
  return 0
}

function isSupportedPaymentType(paymentType) {
  return PAYMENT_TYPES.includes(paymentType)
}

function mapGatewayStatusToPaymentStatus(gatewayStatus) {
  const normalizedStatus = String(gatewayStatus || '')
    .trim()
    .toLowerCase()
  if (normalizedStatus === 'success') return 'success'
  if (['failed', 'abandoned', 'reversed'].includes(normalizedStatus)) return 'failed'
  return 'pending'
}

function buildPaymentReference(paymentId) {
  const normalizedId = String(paymentId || '').trim()
  if (!/^payment-[0-9a-f-]{36}$/i.test(normalizedId)) {
    throw new Error('A valid payment request ID is required.')
  }
  return `RANDSA-${normalizedId.slice('payment-'.length).toUpperCase()}`
}

function normalizePaymentCallbackUrl(value) {
  let url
  try {
    url = new URL(String(value || '').trim())
  } catch {
    throw new Error('A valid payment callback URL is required.')
  }

  const isProductionOrigin = PRODUCTION_CALLBACK_ORIGINS.has(url.origin)
  const isLocalOrigin =
    url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)

  if ((!isProductionOrigin && !isLocalOrigin) || !url.pathname.startsWith('/payment/')) {
    throw new Error('The payment callback URL is not allowed.')
  }

  url.hash = ''
  url.searchParams.delete('reference')
  url.searchParams.delete('trxref')
  return url.toString()
}

function parsePaystackInitialization(payload, expectedReference) {
  const data = payload?.data
  const reference = String(data?.reference || '').trim()
  const accessCode = String(data?.access_code || '').trim()
  const authorizationUrl = String(data?.authorization_url || '').trim()

  if (payload?.status !== true || reference !== expectedReference || !accessCode) {
    throw new Error('Paystack returned an invalid transaction initialization response.')
  }

  let checkoutUrl
  try {
    checkoutUrl = new URL(authorizationUrl)
  } catch {
    throw new Error('Paystack did not return a valid checkout URL.')
  }

  if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.paystack.com') {
    throw new Error('Paystack returned an untrusted checkout URL.')
  }

  return { reference, accessCode, authorizationUrl: checkoutUrl.toString() }
}

function createPaystackSignature(rawBody, secret) {
  return nodeCrypto.createHmac('sha512', secret).update(rawBody).digest('hex')
}

function hasValidPaystackSignature(rawBody, signature, secret) {
  const received = Buffer.from(String(signature || ''), 'utf8')
  const expected = Buffer.from(createPaystackSignature(rawBody, secret), 'utf8')
  return received.length === expected.length && nodeCrypto.timingSafeEqual(received, expected)
}

module.exports = {
  PAYMENT_TYPES,
  buildPaymentReference,
  createPaystackSignature,
  getExpectedPaymentAmount,
  hasValidPaystackSignature,
  isSupportedPaymentType,
  mapGatewayStatusToPaymentStatus,
  normalizePaymentCallbackUrl,
  parsePaystackInitialization,
}
