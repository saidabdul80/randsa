const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  calculateBookingPrice,
  getEligibleAgentSchedules,
  getBookingRange,
  isMatchingBookingRequest,
  normalizeBookingDateValue,
  normalizeBookingTimeValue,
  rangesOverlap,
  resolveBookingMode,
  validateBookingSelection,
} = require('../booking-engine')

test('keeps the deployable booking mode config aligned with the frontend config', () => {
  const frontendConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../shared/booking-modes.json'), 'utf8')
  )
  const backendConfig = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../booking-modes.json'), 'utf8')
  )
  assert.deepEqual(backendConfig, frontendConfig)
})

test('resolves supported aliases and the generic fallback', () => {
  assert.equal(
    resolveBookingMode({ propertyType: 'Duplex', category: 'residential' }),
    'property_inspection'
  )
  assert.equal(
    resolveBookingMode({ propertyType: 'Office space', category: 'commercial' }),
    'commercial_inspection'
  )
  assert.equal(
    resolveBookingMode({ propertyType: 'Vehicle', category: 'vehicle' }),
    'vehicle_rental'
  )
  assert.equal(
    resolveBookingMode({ propertyType: 'Event centre', category: 'event' }),
    'event_booking'
  )
  assert.equal(
    resolveBookingMode({ propertyType: 'Horse rental', category: 'horse' }),
    'horse_session'
  )
  assert.equal(
    resolveBookingMode({ propertyType: 'Equipment', category: 'other' }),
    'generic_rental'
  )
})

test('reads a legacy inspection booking as a 30-minute range', () => {
  const range = getBookingRange({ inspectionDate: '2030-03-12', inspectionTime: '10:00' })
  assert.ok(range)
  assert.equal(range.durationMinutes, 30)
  assert.equal(range.endAt.getTime() - range.startAt.getTime(), 30 * 60000)
})

test('detects overlap with a category buffer', () => {
  assert.equal(
    rangesOverlap(
      new Date('2030-03-12T09:00:00Z'),
      new Date('2030-03-12T10:00:00Z'),
      new Date('2030-03-12T10:30:00Z'),
      new Date('2030-03-12T11:30:00Z'),
      60
    ),
    true
  )
})

test('calculates vehicle rental totals from the stored daily rate', () => {
  assert.deepEqual(
    calculateBookingPrice(
      { rentPrice: 25000, paymentDuration: 'daily' },
      'vehicle_rental',
      2880,
      1
    ),
    { pricingUnit: 'per_day', estimatedTotal: 50000 }
  )
})

test('rejects a return time before pickup', () => {
  assert.throws(
    () =>
      validateBookingSelection(
        {
          inspectionDate: '2035-03-12',
          inspectionTime: '10:00',
          endDate: '2035-03-12',
          endTime: '09:00',
          guestPhone: '08000000000',
        },
        {
          propertyType: 'Car',
          category: 'vehicle',
          isAvailable: true,
          rentPrice: 1000,
          paymentDuration: 'daily',
        },
        new Date('2030-01-01T00:00:00Z')
      ),
    /minimum booking duration/
  )
})

test('honours persisted agent schedules and unavailable dates', () => {
  const property = {
    propertyType: 'House rent',
    category: 'residential',
    isAvailable: true,
    ownerId: 'owner-1',
    inspectionFee: 2000,
    paymentDuration: 'yearly',
    availabilityConfig: {
      agents: [
        {
          agentId: 'agent-1',
          workingDays: [2],
          startTime: '09:00',
          endTime: '13:00',
          slotIntervalMinutes: 30,
          inspectionDurationMinutes: 45,
          maximumInspectionsPerDay: 4,
          unavailableDates: [],
          vacationPeriods: [],
        },
      ],
      blockedDates: [],
      bufferMinutes: 15,
      minimumDurationMinutes: 45,
    },
  }
  const input = {
    inspectionDate: '2035-03-13',
    inspectionTime: '10:00',
    guestPhone: '08000000000',
  }
  const selection = validateBookingSelection(input, property, new Date('2030-01-01T00:00:00Z'))
  assert.equal(selection.durationMinutes, 45)
  assert.equal(getEligibleAgentSchedules(property, selection, input)[0].agentId, 'agent-1')
})

test('matches an idempotent booking request to both its user and listing', () => {
  const booking = { userId: 'user-1', propertyId: 'property-1' }
  assert.equal(isMatchingBookingRequest(booking, 'user-1', 'property-1'), true)
  assert.equal(isMatchingBookingRequest(booking, 'user-1', 'property-2'), false)
  assert.equal(isMatchingBookingRequest(booking, 'user-2', 'property-1'), false)
})

test('supports the legacy listing ID when matching an idempotent booking request', () => {
  assert.equal(
    isMatchingBookingRequest({ userId: 'user-1', listingId: 'property-1' }, 'user-1', 'property-1'),
    true
  )
})

test('normalizes localized booking dates and 12-hour times', () => {
  assert.equal(normalizeBookingDateValue('08/30/2026'), '2026-08-30')
  assert.equal(normalizeBookingTimeValue('04:22 PM'), '16:22')
  assert.equal(normalizeBookingTimeValue('12:05 AM'), '00:05')
})

test('accepts the localized vehicle schedule shown by native controls', () => {
  const selection = validateBookingSelection(
    {
      inspectionDate: '08/30/2026',
      inspectionTime: '04:22 PM',
      endDate: '09/30/2026',
      endTime: '11:21 PM',
      guestPhone: '08000000000',
    },
    {
      propertyType: 'Car',
      category: 'vehicle',
      isAvailable: true,
      rentPrice: 25000,
      paymentDuration: 'daily',
    },
    new Date('2026-08-08T00:00:00Z')
  )

  assert.equal(selection.bookingMode, 'vehicle_rental')
  assert.equal(selection.pricingUnit, 'per_day')
  assert.ok(selection.endAt > selection.startAt)
})
