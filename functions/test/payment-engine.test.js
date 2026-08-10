const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildPaymentReference,
  createPaystackSignature,
  getExpectedPaymentAmount,
  hasValidPaystackSignature,
  isSupportedPaymentType,
  mapGatewayStatusToPaymentStatus,
  normalizePaymentCallbackUrl,
  parsePaystackInitialization,
} = require('../payment-engine')

test('calculates server-authoritative property payment amounts', () => {
  const property = { inspectionFee: 2000, cautionFee: 50000, agencyFee: 30000, rentPrice: 250000 }
  assert.equal(getExpectedPaymentAmount(property, 'inspection_fee'), 2000)
  assert.equal(getExpectedPaymentAmount(property, 'rent_deposit'), 50000)
  assert.equal(getExpectedPaymentAmount(property, 'service_fee'), 30000)
  assert.equal(getExpectedPaymentAmount(property, 'full_rent_payment'), 250000)
  assert.equal(getExpectedPaymentAmount(property, 'unknown'), 0)
})

test('accepts only supported payment types', () => {
  assert.equal(isSupportedPaymentType('booking_payment'), true)
  assert.equal(isSupportedPaymentType('inspection_fee'), true)
  assert.equal(isSupportedPaymentType('arbitrary_fee'), false)
})

test('keeps non-terminal gateway statuses retryable', () => {
  assert.equal(mapGatewayStatusToPaymentStatus('success'), 'success')
  assert.equal(mapGatewayStatusToPaymentStatus('failed'), 'failed')
  assert.equal(mapGatewayStatusToPaymentStatus('abandoned'), 'failed')
  assert.equal(mapGatewayStatusToPaymentStatus('pending'), 'pending')
  assert.equal(mapGatewayStatusToPaymentStatus('ongoing'), 'pending')
})

test('creates a deterministic Paystack-safe reference from a payment ID', () => {
  const paymentId = 'payment-123e4567-e89b-12d3-a456-426614174000'
  assert.equal(buildPaymentReference(paymentId), 'RANDSA-123E4567-E89B-12D3-A456-426614174000')
  assert.throws(() => buildPaymentReference('unsafe/reference'))
})

test('allows production and local payment callbacks only', () => {
  assert.equal(
    normalizePaymentCallbackUrl(
      'https://randsa-67e93.web.app/payment/property-1?paymentId=payment-1&reference=remove'
    ),
    'https://randsa-67e93.web.app/payment/property-1?paymentId=payment-1'
  )
  assert.equal(
    normalizePaymentCallbackUrl('http://127.0.0.1:5174/payment/property-1?paymentId=payment-1'),
    'http://127.0.0.1:5174/payment/property-1?paymentId=payment-1'
  )
  assert.throws(() => normalizePaymentCallbackUrl('https://example.com/payment/property-1'))
  assert.throws(() => normalizePaymentCallbackUrl('https://randsa-67e93.web.app/profile'))
})

test('accepts only a matching trusted Paystack initialization response', () => {
  const reference = 'RANDSA-123'
  assert.deepEqual(
    parsePaystackInitialization(
      {
        status: true,
        data: {
          reference,
          access_code: 'access-code',
          authorization_url: 'https://checkout.paystack.com/access-code',
        },
      },
      reference
    ),
    {
      reference,
      accessCode: 'access-code',
      authorizationUrl: 'https://checkout.paystack.com/access-code',
    }
  )
  assert.throws(() =>
    parsePaystackInitialization(
      {
        status: true,
        data: {
          reference: 'different',
          access_code: 'access-code',
          authorization_url: 'https://checkout.paystack.com/access-code',
        },
      },
      reference
    )
  )
})

test('verifies Paystack webhook signatures without plain string comparison', () => {
  const body = Buffer.from(JSON.stringify({ event: 'charge.success' }))
  const signature = createPaystackSignature(body, 'test-secret')
  assert.equal(hasValidPaystackSignature(body, signature, 'test-secret'), true)
  assert.equal(hasValidPaystackSignature(body, signature, 'wrong-secret'), false)
})
