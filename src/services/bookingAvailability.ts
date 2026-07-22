import { httpsCallable } from 'firebase/functions'

import { authMode, functions } from '../lib/firebase'
import type { BookingInput, BookingMode, BookingStatus } from '../types/booking'
import type { PropertyRecord } from '../types/property'
import { listAllLocalBookings } from './bookings'
import {
  getBookingModeConfig,
  normalizeBookingSelection,
  resolveBookingMode,
  usesTimeSlotTimeline,
} from './bookingModes'

export interface BookingAvailabilityBlock {
  id: string
  propertyId: string
  agentId: string
  status: BookingStatus
  bookingMode: BookingMode
  startAt: string
  endAt: string
  inspectionDate: string
  inspectionTime: string
  durationMinutes: number
}

interface AvailabilityResponse {
  bookings: BookingAvailabilityBlock[]
}

const CACHE_DURATION_MS = 30_000
const cache = new Map<string, { expiresAt: number; bookings: BookingAvailabilityBlock[] }>()

function mapLocalBooking(booking: ReturnType<typeof listAllLocalBookings>[number]): BookingAvailabilityBlock {
  const startAt = booking.startAt || new Date(`${booking.inspectionDate}T${booking.inspectionTime}`).toISOString()
  const durationMinutes = booking.durationMinutes || 30
  const endAt = booking.endAt || new Date(new Date(startAt).getTime() + durationMinutes * 60_000).toISOString()

  return {
    id: booking.id,
    propertyId: booking.propertyId,
    agentId: booking.agentId,
    status: booking.status,
    bookingMode: booking.bookingMode || 'property_inspection',
    startAt,
    endAt,
    inspectionDate: booking.inspectionDate,
    inspectionTime: booking.inspectionTime,
    durationMinutes,
  }
}

export async function loadKnownListingBookings(
  propertyId: string,
  options: { force?: boolean } = {},
) {
  const cached = cache.get(propertyId)
  if (!options.force && cached && cached.expiresAt > Date.now()) {
    return cached.bookings
  }

  let bookings: BookingAvailabilityBlock[]
  if (authMode === 'local') {
    bookings = listAllLocalBookings()
      .filter((booking) => booking.propertyId === propertyId)
      .map(mapLocalBooking)
  } else {
    if (!functions) {
      throw new Error('Firebase Functions is not configured for live booking availability.')
    }

    const callable = httpsCallable<{ propertyId: string }, AvailabilityResponse>(
      functions,
      'getBookingAvailability',
    )
    const response = await callable({ propertyId })
    bookings = response.data.bookings
  }

  cache.set(propertyId, { expiresAt: Date.now() + CACHE_DURATION_MS, bookings })
  return bookings
}

export function clearBookingAvailabilityCache(propertyId: string) {
  cache.delete(propertyId)
}

export function bookingRangesOverlap(
  firstStartAt: string,
  firstEndAt: string,
  secondStartAt: string,
  secondEndAt: string,
  bufferMinutes = 0,
) {
  const bufferMs = bufferMinutes * 60_000
  const firstStart = new Date(firstStartAt).getTime() - bufferMs
  const firstEnd = new Date(firstEndAt).getTime() + bufferMs
  const secondStart = new Date(secondStartAt).getTime()
  const secondEnd = new Date(secondEndAt).getTime()
  return firstStart < secondEnd && secondStart < firstEnd
}

export function findBookingConflict(
  input: BookingInput,
  property: PropertyRecord,
  bookings: BookingAvailabilityBlock[],
) {
  const selection = normalizeBookingSelection(input, property)
  const config = getBookingModeConfig(resolveBookingMode(property))
  const bufferMinutes = property.availabilityConfig?.bufferMinutes ?? config.bufferMinutes

  const activeBookings = bookings.filter(
    (booking) =>
      booking.status !== 'cancelled' &&
      booking.status !== 'completed',
  )

  if (usesTimeSlotTimeline(selection.bookingMode)) {
    const agentIds = property.availabilityConfig?.agents?.length
      ? property.availabilityConfig.agents.map((agent) => agent.agentId)
      : [property.ownerId]
    const everyAgentIsOccupied = agentIds.every((agentId) =>
      activeBookings.some(
        (booking) =>
          booking.agentId === agentId
          && bookingRangesOverlap(
            selection.startAt,
            selection.endAt,
            booking.startAt,
            booking.endAt,
            bufferMinutes,
          ),
      ),
    )
    return everyAgentIsOccupied ? activeBookings[0] ?? null : null
  }

  return activeBookings.find(
    (booking) =>
      bookingRangesOverlap(
        selection.startAt,
        selection.endAt,
        booking.startAt,
        booking.endAt,
        bufferMinutes,
      ),
  ) ?? null
}
