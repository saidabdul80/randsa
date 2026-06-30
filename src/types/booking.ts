import type { PaymentStatus } from './payment'

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface BookingRecord {
  id: string
  userId: string
  propertyId: string
  agentId: string
  inspectionDate: string
  inspectionTime: string
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
  guestPhone: string
  notes: string
}

export function createEmptyBookingInput(): BookingInput {
  return {
    inspectionDate: '',
    inspectionTime: '',
    guestPhone: '',
    notes: '',
  }
}

export function formatBookingStatusLabel(status: BookingStatus) {
  return status
}

export function getInspectionDateTime(booking: Pick<BookingRecord, 'inspectionDate' | 'inspectionTime'>) {
  return new Date(`${booking.inspectionDate}T${booking.inspectionTime}`)
}
