import {
  clearBookingAvailabilityCache,
  loadKnownListingBookings,
  type BookingAvailabilityBlock,
} from './bookingAvailability'

export type InspectionAvailabilityState = 'available' | 'limited' | 'fully_booked' | 'disabled'

export interface InspectionVacationPeriod {
  startDate: string
  endDate: string
}

export interface InspectionAgentSchedule {
  agentId: string
  workingDays: number[]
  startTime: string
  endTime: string
  slotIntervalMinutes: number
  inspectionDurationMinutes: number
  maximumInspectionsPerDay: number
  unavailableDates: string[]
  vacationPeriods: InspectionVacationPeriod[]
}

export interface InspectionAvailabilityConfig {
  agents: InspectionAgentSchedule[]
  limitedRemainingCapacity: number
}

export interface InspectionSlotAvailability {
  value: string
  label: string
  available: boolean
  availableAgentIds: string[]
}

export interface InspectionDateAvailability {
  date: string
  state: InspectionAvailabilityState
  label: string
  description: string
  selectable: boolean
  availableSlots: InspectionSlotAvailability[]
  remainingCapacity: number
  totalCapacity: number
  estimatedDurationMinutes: number
}

interface KnownBookingsCacheEntry {
  expiresAt: number
  bookings: BookingAvailabilityBlock[]
}

const KNOWN_BOOKINGS_CACHE_DURATION_MS = 30_000
const knownBookingsCache = new Map<string, KnownBookingsCacheEntry>()

export function createDefaultInspectionAvailabilityConfig(
  primaryAgentId: string
): InspectionAvailabilityConfig {
  return {
    agents: [
      {
        agentId: primaryAgentId,
        workingDays: [1, 2, 3, 4, 5, 6],
        startTime: '09:00',
        endTime: '17:00',
        slotIntervalMinutes: 30,
        inspectionDurationMinutes: 30,
        maximumInspectionsPerDay: 16,
        unavailableDates: [],
        vacationPeriods: [],
      },
    ],
    limitedRemainingCapacity: 3,
  }
}

export async function loadKnownPropertyInspectionBookings(
  _userId: string,
  propertyId: string,
  options: { force?: boolean } = {}
) {
  const cacheKey = `${_userId}:${propertyId}`
  const cached = knownBookingsCache.get(cacheKey)

  if (!options.force && cached && cached.expiresAt > Date.now()) {
    return cached.bookings
  }

  const propertyBookings = await loadKnownListingBookings(propertyId, options)

  knownBookingsCache.set(cacheKey, {
    expiresAt: Date.now() + KNOWN_BOOKINGS_CACHE_DURATION_MS,
    bookings: propertyBookings,
  })

  return propertyBookings
}

export function clearKnownInspectionAvailabilityCache(userId: string, propertyId: string) {
  knownBookingsCache.delete(`${userId}:${propertyId}`)
  clearBookingAvailabilityCache(propertyId)
}

export function calculateInspectionDateAvailability(
  dateIso: string,
  config: InspectionAvailabilityConfig,
  propertyBookings: BookingAvailabilityBlock[],
  now = new Date()
): InspectionDateAvailability {
  const date = parseIsoDate(dateIso)
  const today = startOfDay(now)
  const estimatedDurationMinutes = getEstimatedInspectionDuration(config)

  if (date.getTime() < today.getTime()) {
    return buildUnavailableDate(dateIso, 'Past date', estimatedDurationMinutes)
  }

  const scheduledAgents = config.agents.filter((agent) =>
    isAgentScheduledForDate(agent, dateIso, date)
  )

  if (!scheduledAgents.length) {
    return buildUnavailableDate(
      dateIso,
      'Inspections are unavailable on this date',
      estimatedDurationMinutes
    )
  }

  const activeBookings = propertyBookings.filter(
    (booking) =>
      booking.inspectionDate === dateIso &&
      booking.status !== 'cancelled' &&
      booking.status !== 'completed'
  )
  const slotMap = new Map<
    string,
    { label: string; availableAgentIds: string[]; totalAgentCapacity: number }
  >()
  let totalCapacity = 0
  let remainingCapacity = 0

  for (const agent of scheduledAgents) {
    const agentBookings = activeBookings.filter((booking) => booking.agentId === agent.agentId)
    const reachedDailyLimit = agentBookings.length >= agent.maximumInspectionsPerDay
    const agentSlots = buildAgentSlots(agent)

    for (const value of agentSlots) {
      const slot = slotMap.get(value) ?? {
        label: formatTimeLabel(value),
        availableAgentIds: [],
        totalAgentCapacity: 0,
      }
      slot.totalAgentCapacity += 1
      totalCapacity += 1

      const isPastTime =
        dateIso === formatIsoDate(now) && timeToMinutes(value) <= currentMinutes(now)
      const isOccupied = agentBookings.some((booking) =>
        timeRangesOverlap(
          value,
          agent.inspectionDurationMinutes,
          booking.inspectionTime,
          agent.inspectionDurationMinutes
        )
      )

      if (!reachedDailyLimit && !isPastTime && !isOccupied) {
        slot.availableAgentIds.push(agent.agentId)
        remainingCapacity += 1
      }

      slotMap.set(value, slot)
    }
  }

  const availableSlots = [...slotMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, slot]) => ({
      value,
      label: slot.label,
      available: slot.availableAgentIds.length > 0,
      availableAgentIds: slot.availableAgentIds,
    }))

  if (remainingCapacity === 0) {
    return {
      date: dateIso,
      state: 'fully_booked',
      label: 'Fully booked',
      description: 'No inspection slots remain on this date.',
      selectable: false,
      availableSlots,
      remainingCapacity,
      totalCapacity,
      estimatedDurationMinutes,
    }
  }

  if (remainingCapacity <= config.limitedRemainingCapacity) {
    return {
      date: dateIso,
      state: 'limited',
      label: 'Limited',
      description: `${remainingCapacity} inspection ${remainingCapacity === 1 ? 'slot' : 'slots'} remaining.`,
      selectable: true,
      availableSlots,
      remainingCapacity,
      totalCapacity,
      estimatedDurationMinutes,
    }
  }

  return {
    date: dateIso,
    state: 'available',
    label: 'Available',
    description: `${remainingCapacity} inspection slots available.`,
    selectable: true,
    availableSlots,
    remainingCapacity,
    totalCapacity,
    estimatedDurationMinutes,
  }
}

export function getEstimatedInspectionDuration(config: InspectionAvailabilityConfig) {
  return config.agents[0]?.inspectionDurationMinutes ?? 30
}

export function formatInspectionDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} mins`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const hourLabel = `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  return remainingMinutes ? `${hourLabel} ${remainingMinutes} mins` : hourLabel
}

function buildUnavailableDate(
  date: string,
  description: string,
  estimatedDurationMinutes: number
): InspectionDateAvailability {
  return {
    date,
    state: 'disabled',
    label: 'Unavailable',
    description,
    selectable: false,
    availableSlots: [],
    remainingCapacity: 0,
    totalCapacity: 0,
    estimatedDurationMinutes,
  }
}

function isAgentScheduledForDate(agent: InspectionAgentSchedule, dateIso: string, date: Date) {
  if (!agent.workingDays.includes(date.getDay()) || agent.unavailableDates.includes(dateIso)) {
    return false
  }

  return !agent.vacationPeriods.some(
    (period) => dateIso >= period.startDate && dateIso <= period.endDate
  )
}

function buildAgentSlots(agent: InspectionAgentSchedule) {
  const slots: string[] = []
  const startMinutes = timeToMinutes(agent.startTime)
  const endMinutes = timeToMinutes(agent.endTime)
  const lastStartMinutes = endMinutes - agent.inspectionDurationMinutes

  for (
    let minutes = startMinutes;
    minutes <= lastStartMinutes;
    minutes += agent.slotIntervalMinutes
  ) {
    slots.push(minutesToTime(minutes))
  }

  return slots
}

function timeRangesOverlap(
  firstStart: string,
  firstDuration: number,
  secondStart: string,
  secondDuration: number
) {
  const firstStartMinutes = timeToMinutes(firstStart)
  const secondStartMinutes = timeToMinutes(secondStart)
  return (
    firstStartMinutes < secondStartMinutes + secondDuration &&
    secondStartMinutes < firstStartMinutes + firstDuration
  )
}

function currentMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const minutePart = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutePart).padStart(2, '0')}`
}

function formatTimeLabel(value: string) {
  const [hours = 0, minutes = 0] = value.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseIsoDate(value: string) {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
