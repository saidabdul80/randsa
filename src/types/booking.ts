import type { PaymentStatus } from './payment'

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type BookingMode =
  | 'property_inspection'
  | 'commercial_inspection'
  | 'vehicle_rental'
  | 'event_booking'
  | 'horse_session'
  | 'generic_rental'
export type BookingPricingUnit =
  | 'per_inspection'
  | 'per_hour'
  | 'per_session'
  | 'per_day'
  | 'per_month'
  | 'per_quarter'
  | 'per_half_year'
  | 'per_year'
  | 'custom'
  | 'fixed'

export interface BookingCategoryDetails {
  pickupLocation?: string
  returnLocation?: string
  expectedGuests?: number
  eventType?: string
  activityType?: string
}

export interface BookingRecord {
  id: string
  userId: string
  propertyId: string
  listingId: string
  agentId: string
  bookingMode: BookingMode
  listingCategory: string
  inspectionDate: string
  inspectionTime: string
  startAt: string
  endAt: string
  durationMinutes: number
  quantity: number
  pricingUnit: BookingPricingUnit
  estimatedTotal: number | null
  categoryDetails: BookingCategoryDetails
  status: BookingStatus
  paymentStatus: PaymentStatus
  reminderSent: boolean
  guestPhone: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface BookingInput {
  inspectionDate: string
  inspectionTime: string
  endDate: string
  endTime: string
  durationMinutes: number | null
  quantity: number
  categoryDetails: BookingCategoryDetails
  requestId: string
  guestPhone: string
  notes: string
}

export function createEmptyBookingInput(): BookingInput {
  return {
    inspectionDate: '',
    inspectionTime: '',
    endDate: '',
    endTime: '',
    durationMinutes: null,
    quantity: 1,
    categoryDetails: {},
    requestId: createBookingRequestId(),
    guestPhone: '',
    notes: '',
  }
}

export function createBookingRequestId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const value = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

export function formatBookingStatusLabel(status: BookingStatus) {
  return status
}

export function getInspectionDateTime(
  booking: Pick<BookingRecord, 'inspectionDate' | 'inspectionTime'>
) {
  return new Date(`${booking.inspectionDate}T${booking.inspectionTime}`)
}

export function getBookingStartDateTime(
  booking: Pick<BookingRecord, 'startAt' | 'inspectionDate' | 'inspectionTime'>
) {
  return booking.startAt ? new Date(booking.startAt) : getInspectionDateTime(booking)
}
