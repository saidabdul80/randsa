const bookingModeConfigs = require('./booking-modes.json')

const INSPECTION_ALIASES = [
  'house',
  'house rent',
  'apartment',
  'flat',
  'duplex',
  'villa',
  'self contained',
  'self-contained',
]
const COMMERCIAL_ALIASES = ['shop', 'shop rent', 'office', 'office space']
const VEHICLE_ALIASES = ['car', 'cars', 'vehicle', 'vehicles', 'car rental', 'vehicle rental']
const EVENT_ALIASES = [
  'event',
  'event space',
  'event spaces',
  'event centre',
  'event center',
  'venue',
]
const HORSE_ALIASES = ['horse', 'horses', 'horse rental', 'horse rentals', 'equestrian']

function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function includesAlias(value, aliases) {
  return aliases.some((alias) => value === alias || value.includes(alias))
}

function resolveBookingMode(listing) {
  const propertyType = normalizeCategory(listing?.propertyType)
  const category = normalizeCategory(listing?.category)

  if (includesAlias(propertyType, COMMERCIAL_ALIASES) || category === 'commercial')
    return 'commercial_inspection'
  if (includesAlias(propertyType, VEHICLE_ALIASES) || category === 'vehicle')
    return 'vehicle_rental'
  if (includesAlias(propertyType, EVENT_ALIASES) || category === 'event') return 'event_booking'
  if (includesAlias(propertyType, HORSE_ALIASES) || category === 'horse') return 'horse_session'
  if (includesAlias(propertyType, INSPECTION_ALIASES) || category === 'residential')
    return 'property_inspection'
  return 'generic_rental'
}

function getBookingModeConfig(mode) {
  return bookingModeConfigs[mode] || bookingModeConfigs.generic_rental
}

function isInspectionMode(mode) {
  return mode === 'property_inspection' || mode === 'commercial_inspection'
}

function usesTimeSlotTimeline(mode) {
  return isInspectionMode(mode) || mode === 'horse_session'
}

function getAvailabilityConfig(property, mode) {
  const modeConfig = getBookingModeConfig(mode)
  const source =
    property?.availabilityConfig && typeof property.availabilityConfig === 'object'
      ? property.availabilityConfig
      : {}
  const sourceAgents = Array.isArray(source.agents) ? source.agents : []
  const defaultAgent = {
    agentId: String(property?.ownerId || ''),
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '17:00',
    slotIntervalMinutes: 30,
    inspectionDurationMinutes: modeConfig.defaultDurationMinutes,
    maximumInspectionsPerDay: Math.max(1, Math.floor(480 / modeConfig.defaultDurationMinutes)),
    unavailableDates: [],
    vacationPeriods: [],
  }

  const agents = (sourceAgents.length ? sourceAgents : [defaultAgent]).map((agent) => ({
    agentId: String(agent?.agentId || property?.ownerId || ''),
    workingDays: Array.isArray(agent?.workingDays)
      ? agent.workingDays.map(Number).filter((day) => day >= 0 && day <= 6)
      : defaultAgent.workingDays,
    startTime: /^\d{2}:\d{2}$/.test(String(agent?.startTime || ''))
      ? agent.startTime
      : defaultAgent.startTime,
    endTime: /^\d{2}:\d{2}$/.test(String(agent?.endTime || ''))
      ? agent.endTime
      : defaultAgent.endTime,
    slotIntervalMinutes: Math.max(1, Number(agent?.slotIntervalMinutes) || 30),
    inspectionDurationMinutes: Math.max(
      1,
      Number(agent?.inspectionDurationMinutes) || modeConfig.defaultDurationMinutes
    ),
    maximumInspectionsPerDay: Math.max(
      1,
      Number(agent?.maximumInspectionsPerDay) || defaultAgent.maximumInspectionsPerDay
    ),
    unavailableDates: Array.isArray(agent?.unavailableDates)
      ? agent.unavailableDates.map(String)
      : [],
    vacationPeriods: Array.isArray(agent?.vacationPeriods) ? agent.vacationPeriods : [],
  }))

  return {
    agents,
    blockedDates: Array.isArray(source.blockedDates) ? source.blockedDates.map(String) : [],
    bufferMinutes:
      source.bufferMinutes === null || source.bufferMinutes === undefined
        ? modeConfig.bufferMinutes
        : Math.max(0, Number(source.bufferMinutes) || 0),
    minimumDurationMinutes:
      source.minimumDurationMinutes === null || source.minimumDurationMinutes === undefined
        ? modeConfig.minimumDurationMinutes
        : Math.max(1, Number(source.minimumDurationMinutes) || modeConfig.minimumDurationMinutes),
  }
}

function timeToMinutes(value) {
  const [hours = 0, minutes = 0] = String(value || '')
    .split(':')
    .map(Number)
  return hours * 60 + minutes
}

function getEligibleAgentSchedules(property, selection, input) {
  const availability = getAvailabilityConfig(property, selection.bookingMode)
  const date = String(input?.inspectionDate || '')
  const localDate = new Date(`${date}T12:00:00+01:00`)
  const day = localDate.getDay()
  const startMinute = timeToMinutes(input?.inspectionTime)

  return availability.agents.filter((agent) => {
    if (!agent.agentId || !agent.workingDays.includes(day) || agent.unavailableDates.includes(date))
      return false
    if (availability.blockedDates.includes(date)) return false
    if (
      agent.vacationPeriods.some(
        (period) => date >= String(period.startDate || '') && date <= String(period.endDate || '')
      )
    )
      return false
    if (startMinute < timeToMinutes(agent.startTime)) return false
    if (startMinute + selection.durationMinutes > timeToMinutes(agent.endTime)) return false
    return startMinute % agent.slotIntervalMinutes === 0
  })
}

function getBookingPricingUnit(paymentDuration, mode) {
  if (isInspectionMode(mode)) return 'per_inspection'

  const units = {
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
  return units[paymentDuration] || getBookingModeConfig(mode).defaultPricingUnit
}

function parseBookingDateTime(date, time) {
  const dateValue = String(date || '').trim()
  const timeValue = String(time || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) return null

  const parsed = new Date(`${dateValue}T${timeValue}:00+01:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function calculateBookingPrice(property, mode, durationMinutes, quantity = 1) {
  const pricingUnit = getBookingPricingUnit(property?.paymentDuration, mode)
  const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
  const rate = Number(isInspectionMode(mode) ? property?.inspectionFee : property?.rentPrice)
  if (!Number.isFinite(rate) || rate <= 0) return { pricingUnit, estimatedTotal: null }
  if (pricingUnit === 'custom') return { pricingUnit, estimatedTotal: null }

  let units = 1
  if (pricingUnit === 'per_hour') units = Math.max(1, durationMinutes / 60)
  if (pricingUnit === 'per_day') units = Math.max(1, Math.ceil(durationMinutes / 1440))
  if (pricingUnit === 'per_month') units = Math.max(1, Math.ceil(durationMinutes / 43200))
  if (pricingUnit === 'per_quarter') units = Math.max(1, Math.ceil(durationMinutes / 129600))
  if (pricingUnit === 'per_half_year') units = Math.max(1, Math.ceil(durationMinutes / 259200))
  if (pricingUnit === 'per_year') units = Math.max(1, Math.ceil(durationMinutes / 525600))

  return { pricingUnit, estimatedTotal: Math.round(rate * units * safeQuantity) }
}

function normalizeBookingSelection(input, property) {
  const bookingMode = resolveBookingMode(property)
  const config = getBookingModeConfig(bookingMode)
  const startAt = parseBookingDateTime(input?.inspectionDate, input?.inspectionTime)
  if (!startAt)
    throw new Error(
      `Select a valid ${config.dateLabel.toLowerCase()} and ${config.startTimeLabel.toLowerCase()}.`
    )

  let endAt
  if (usesTimeSlotTimeline(bookingMode)) {
    const availability = getAvailabilityConfig(property, bookingMode)
    const configuredDuration = availability.agents[0]?.inspectionDurationMinutes
    const requestedDuration = Number(input?.durationMinutes)
    const duration =
      Number.isFinite(requestedDuration) && requestedDuration > 0
        ? requestedDuration
        : configuredDuration || config.defaultDurationMinutes
    endAt = new Date(startAt.getTime() + duration * 60000)
  } else {
    const endDate =
      config.selectionKind === 'same_day_range' ? input?.inspectionDate : input?.endDate
    endAt = parseBookingDateTime(endDate, input?.endTime)
    if (!endAt)
      throw new Error(`Select a valid ${config.endTimeLabel?.toLowerCase() || 'end time'}.`)
  }

  const durationMinutes = Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 60000))
  const quantity = Math.max(1, Math.floor(Number(input?.quantity) || 1))
  return {
    bookingMode,
    startAt,
    endAt,
    durationMinutes,
    quantity,
    ...calculateBookingPrice(property, bookingMode, durationMinutes, quantity),
  }
}

function validateBookingSelection(input, property, now = new Date()) {
  if (property?.isAvailable !== true)
    throw new Error('This listing is not currently available for booking.')
  if (!String(input?.guestPhone || '').trim())
    throw new Error('Add a customer phone number before saving the booking.')

  const selection = normalizeBookingSelection(input, property)
  const config = getBookingModeConfig(selection.bookingMode)
  const availability = getAvailabilityConfig(property, selection.bookingMode)
  if (selection.startAt.getTime() <= now.getTime())
    throw new Error('Choose a booking time in the future.')
  if (selection.durationMinutes < availability.minimumDurationMinutes) {
    throw new Error(
      `The minimum booking duration is ${availability.minimumDurationMinutes} minutes.`
    )
  }

  const endDate = String(input?.endDate || input?.inspectionDate || '')
  if (availability.blockedDates.some((date) => date >= input.inspectionDate && date <= endDate)) {
    throw new Error('The selected booking period includes an unavailable date.')
  }

  if (usesTimeSlotTimeline(selection.bookingMode)) {
    if (!getEligibleAgentSchedules(property, selection, input).length) {
      throw new Error('Choose one of the available times in the listing schedule.')
    }
  }

  return selection
}

function rangesOverlap(firstStart, firstEnd, secondStart, secondEnd, bufferMinutes = 0) {
  const bufferMs = bufferMinutes * 60000
  return (
    firstStart.getTime() - bufferMs < secondEnd.getTime() &&
    secondStart.getTime() < firstEnd.getTime() + bufferMs
  )
}

function getBookingRange(data) {
  let startAt = data?.startAt?.toDate
    ? data.startAt.toDate()
    : data?.startAt
      ? new Date(data.startAt)
      : null
  if (!startAt || Number.isNaN(startAt.getTime())) {
    startAt = parseBookingDateTime(data?.inspectionDate, data?.inspectionTime)
  }
  if (!startAt) return null

  let endAt = data?.endAt?.toDate ? data.endAt.toDate() : data?.endAt ? new Date(data.endAt) : null
  const durationMinutes = Math.max(1, Number(data?.durationMinutes) || 30)
  if (!endAt || Number.isNaN(endAt.getTime()))
    endAt = new Date(startAt.getTime() + durationMinutes * 60000)

  return { startAt, endAt, durationMinutes }
}

function sanitizeCategoryDetails(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const allowedKeys = [
    'pickupLocation',
    'returnLocation',
    'expectedGuests',
    'eventType',
    'activityType',
  ]
  const result = {}
  for (const key of allowedKeys) {
    const item = value[key]
    if (typeof item === 'string' && item.trim()) result[key] = item.trim().slice(0, 160)
    if (key === 'expectedGuests' && Number.isFinite(Number(item))) {
      result[key] = Math.max(1, Math.min(100000, Math.floor(Number(item))))
    }
  }
  return result
}

module.exports = {
  calculateBookingPrice,
  getBookingModeConfig,
  getAvailabilityConfig,
  getEligibleAgentSchedules,
  getBookingRange,
  isInspectionMode,
  normalizeBookingSelection,
  rangesOverlap,
  resolveBookingMode,
  sanitizeCategoryDetails,
  usesTimeSlotTimeline,
  validateBookingSelection,
}
