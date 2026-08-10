import bookingModeData from '../../shared/booking-modes.json'

import type { BookingInput, BookingMode, BookingPricingUnit, BookingRecord } from '../types/booking'
import type { PaymentDuration, PropertyRecord } from '../types/property'

export type BookingSelectionKind = 'time_slot' | 'date_time_range' | 'same_day_range'

export interface BookingModeConfig {
  title: string
  description: string
  primaryActionLabel: string
  dateLabel: string
  startTimeLabel: string
  endDateLabel?: string
  endTimeLabel?: string
  summaryLabel: string
  paymentLabel: string
  reminderTitle: string
  reminderLead: string
  selectionKind: BookingSelectionKind
  defaultDurationMinutes: number
  minimumDurationMinutes: number
  bufferMinutes: number
  defaultPricingUnit: BookingPricingUnit
}

export interface NormalizedBookingSelection {
  bookingMode: BookingMode
  startAt: string
  endAt: string
  durationMinutes: number
  quantity: number
  pricingUnit: BookingPricingUnit
  estimatedTotal: number | null
}

const bookingModeConfigs = bookingModeData as Record<BookingMode, BookingModeConfig>

const inspectionAliases = [
  'house',
  'house rent',
  'apartment',
  'flat',
  'duplex',
  'villa',
  'self contained',
  'self-contained',
]
const commercialAliases = ['shop', 'shop rent', 'office', 'office space']
const vehicleAliases = ['car', 'cars', 'vehicle', 'vehicles', 'car rental', 'vehicle rental']
const eventAliases = [
  'event',
  'event space',
  'event spaces',
  'event centre',
  'event center',
  'venue',
]
const horseAliases = ['horse', 'horses', 'horse rental', 'horse rentals', 'equestrian']

function normalizeCategory(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function includesAlias(value: string, aliases: string[]) {
  return aliases.some((alias) => value === alias || value.includes(alias))
}

export function resolveBookingMode(
  listing: Pick<PropertyRecord, 'propertyType' | 'category'> | null | undefined
): BookingMode {
  const propertyType = normalizeCategory(listing?.propertyType)
  const category = normalizeCategory(listing?.category)

  if (includesAlias(propertyType, commercialAliases) || category === 'commercial') {
    return 'commercial_inspection'
  }

  if (includesAlias(propertyType, vehicleAliases) || category === 'vehicle') {
    return 'vehicle_rental'
  }

  if (includesAlias(propertyType, eventAliases) || category === 'event') {
    return 'event_booking'
  }

  if (includesAlias(propertyType, horseAliases) || category === 'horse') {
    return 'horse_session'
  }

  if (includesAlias(propertyType, inspectionAliases) || category === 'residential') {
    return 'property_inspection'
  }

  return 'generic_rental'
}

export function getBookingModeConfig(mode: BookingMode) {
  return bookingModeConfigs[mode]
}

export function isInspectionMode(mode: BookingMode) {
  return mode === 'property_inspection' || mode === 'commercial_inspection'
}

export function usesTimeSlotTimeline(mode: BookingMode) {
  return isInspectionMode(mode) || mode === 'horse_session'
}

export function getBookingPricingUnit(
  paymentDuration: PaymentDuration,
  mode: BookingMode
): BookingPricingUnit {
  const unitMap: Partial<Record<PaymentDuration, BookingPricingUnit>> = {
    hourly: 'per_hour',
    daily: 'per_day',
    per_session: 'per_session',
    fixed: 'fixed',
    monthly: 'per_month',
    quarterly: 'per_quarter',
    biannually: 'per_half_year',
    yearly: 'per_year',
    custom: 'custom',
  }

  return isInspectionMode(mode)
    ? 'per_inspection'
    : (unitMap[paymentDuration] ?? getBookingModeConfig(mode).defaultPricingUnit)
}

function parseLocalDateTime(date: string, time: string) {
  const dateValue = normalizeBookingDateValue(date)
  const timeValue = normalizeBookingTimeValue(time)
  if (!dateValue || !timeValue) return null

  const value = new Date(`${dateValue}T${timeValue}:00+01:00`)
  return Number.isNaN(value.getTime()) ? null : value
}

export function normalizeBookingDateValue(value: unknown) {
  const rawValue = String(value ?? '').trim()
  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const localizedMatch = rawValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  let year: number
  let month: number
  let day: number

  if (isoMatch) {
    ;[, year, month, day] = isoMatch.map(Number)
  } else if (localizedMatch) {
    const first = Number(localizedMatch[1])
    const second = Number(localizedMatch[2])
    year = Number(localizedMatch[3])
    month = first > 12 ? second : first
    day = first > 12 ? first : second
  } else {
    return null
  }

  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeBookingTimeValue(value: unknown) {
  const rawValue = String(value ?? '').trim()
  const twelveHourMatch = rawValue.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i)
  const twentyFourHourMatch = rawValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  let hours: number
  let minutes: number

  if (twelveHourMatch) {
    hours = Number(twelveHourMatch[1])
    minutes = Number(twelveHourMatch[2])
    if (hours < 1 || hours > 12 || minutes > 59) return null
    hours = (hours % 12) + (twelveHourMatch[3].toLowerCase() === 'pm' ? 12 : 0)
  } else if (twentyFourHourMatch) {
    hours = Number(twentyFourHourMatch[1])
    minutes = Number(twentyFourHourMatch[2])
    if (hours > 23 || minutes > 59) return null
  } else {
    return null
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function calculateBookingDurationMinutes(startAt: Date, endAt: Date) {
  return Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60_000))
}

export function calculateBookingPrice(
  property: Pick<PropertyRecord, 'rentPrice' | 'inspectionFee' | 'paymentDuration'>,
  mode: BookingMode,
  durationMinutes: number,
  quantity = 1
) {
  const pricingUnit = getBookingPricingUnit(property.paymentDuration, mode)
  const safeQuantity = Math.max(1, Math.floor(quantity || 1))
  const rate = isInspectionMode(mode) ? property.inspectionFee : property.rentPrice

  if (!Number.isFinite(rate) || rate <= 0) {
    return { pricingUnit, estimatedTotal: null }
  }

  if (pricingUnit === 'custom') {
    return { pricingUnit, estimatedTotal: null }
  }

  let units = 1
  if (pricingUnit === 'per_hour') units = Math.max(1, durationMinutes / 60)
  if (pricingUnit === 'per_day') units = Math.max(1, Math.ceil(durationMinutes / 1440))
  if (pricingUnit === 'per_month') units = Math.max(1, Math.ceil(durationMinutes / 43_200))
  if (pricingUnit === 'per_quarter') units = Math.max(1, Math.ceil(durationMinutes / 129_600))
  if (pricingUnit === 'per_half_year') units = Math.max(1, Math.ceil(durationMinutes / 259_200))
  if (pricingUnit === 'per_year') units = Math.max(1, Math.ceil(durationMinutes / 525_600))

  return {
    pricingUnit,
    estimatedTotal: Math.round(rate * units * safeQuantity),
  }
}

export function normalizeBookingSelection(
  input: BookingInput,
  property: PropertyRecord
): NormalizedBookingSelection {
  const bookingMode = resolveBookingMode(property)
  const config = getBookingModeConfig(bookingMode)
  const startAt = parseLocalDateTime(input.inspectionDate, input.inspectionTime)

  if (!startAt) {
    throw new Error(
      `Select a valid ${config.dateLabel.toLowerCase()} and ${config.startTimeLabel.toLowerCase()}.`
    )
  }

  let endAt: Date
  if (usesTimeSlotTimeline(bookingMode)) {
    const configuredDuration = property.availabilityConfig?.agents?.[0]?.inspectionDurationMinutes
    endAt = new Date(
      startAt.getTime() +
        (input.durationMinutes ?? configuredDuration ?? config.defaultDurationMinutes) * 60_000
    )
  } else {
    const endDate = config.selectionKind === 'same_day_range' ? input.inspectionDate : input.endDate
    const parsedEnd = parseLocalDateTime(endDate, input.endTime)
    if (!parsedEnd) {
      throw new Error(`Select a valid ${config.endTimeLabel?.toLowerCase() ?? 'end time'}.`)
    }
    endAt = parsedEnd
  }

  const durationMinutes = calculateBookingDurationMinutes(startAt, endAt)
  const quantity = Math.max(1, Math.floor(input.quantity || 1))
  const price = calculateBookingPrice(property, bookingMode, durationMinutes, quantity)

  return {
    bookingMode,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    durationMinutes,
    quantity,
    ...price,
  }
}

export function validateUniversalBookingInput(input: BookingInput, property: PropertyRecord) {
  const config = getBookingModeConfig(resolveBookingMode(property))

  if (!property.isAvailable) {
    throw new Error('This listing is not currently available for booking.')
  }

  if (!input.guestPhone.trim()) {
    throw new Error('Add a customer phone number before saving the booking.')
  }

  const selection = normalizeBookingSelection(input, property)
  if (new Date(selection.startAt).getTime() <= Date.now()) {
    throw new Error('Choose a booking time in the future.')
  }

  const minimumDuration =
    property.availabilityConfig?.minimumDurationMinutes ?? config.minimumDurationMinutes
  if (selection.durationMinutes < minimumDuration) {
    throw new Error(`The minimum booking duration is ${minimumDuration} minutes.`)
  }

  const startDate = normalizeBookingDateValue(input.inspectionDate) ?? ''
  const endDate = normalizeBookingDateValue(input.endDate || input.inspectionDate) ?? ''
  if (
    (property.availabilityConfig?.blockedDates ?? []).some(
      (date) => date >= startDate && date <= endDate
    )
  ) {
    throw new Error('The selected booking period includes an unavailable date.')
  }

  return selection
}

export function getBookingModeFromRecord(booking: Pick<BookingRecord, 'bookingMode'>) {
  return booking.bookingMode || 'property_inspection'
}

export function formatBookingPricingUnit(unit: BookingPricingUnit) {
  const labels: Record<BookingPricingUnit, string> = {
    per_inspection: 'per inspection',
    per_hour: 'per hour',
    per_session: 'per session',
    per_day: 'per day',
    per_month: 'per month',
    per_quarter: 'per quarter',
    per_half_year: 'per six months',
    per_year: 'per year',
    custom: 'custom rate',
    fixed: 'fixed rate',
  }
  return labels[unit]
}
