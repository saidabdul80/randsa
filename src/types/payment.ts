import type { PropertyRecord } from './property'
import type { BookingRecord } from './booking'

export type PaymentType =
  | 'inspection_fee'
  | 'rent_deposit'
  | 'full_rent_payment'
  | 'service_fee'
  | 'booking_payment'

export type PaymentStatus = 'pending' | 'success' | 'failed'
export type PaymentVerificationMode = 'local_bypass' | 'backend_required' | 'backend_verified'

export interface PaymentRecord {
  id: string
  userId: string
  propertyId: string
  bookingId: string | null
  agentId: string
  propertyTitle: string
  payerName: string
  payerEmail: string
  amount: number
  paymentType: PaymentType
  paystackReference: string
  status: PaymentStatus
  verificationMode: PaymentVerificationMode
  createdAt: string
  verifiedAt: string | null
  gatewayStatus: string | null
  gatewayVerifiedAt: string | null
}

export interface VerifyPaymentResult {
  payment: PaymentRecord
  gatewayStatus: string
}

export interface PaymentTypeOption {
  type: PaymentType
  label: string
  description: string
  amount: number
}

const paymentLabelMap: Record<PaymentType, string> = {
  inspection_fee: 'Inspection fee',
  rent_deposit: 'Rent deposit',
  full_rent_payment: 'Full rent payment',
  service_fee: 'Service fee',
  booking_payment: 'Booking payment',
}

const paymentDescriptionMap: Record<PaymentType, string> = {
  inspection_fee: 'Uses the property inspection fee from the listing.',
  rent_deposit:
    'Uses the caution fee for now as the local placeholder deposit amount until final backend rules are confirmed.',
  full_rent_payment: 'Uses the full rent amount shown on the property listing.',
  service_fee:
    'Uses the agency fee for now as the local placeholder service fee until final Paystack rules are confirmed.',
  booking_payment: 'Uses the estimated total stored on the selected booking.',
}

export function formatPaymentTypeLabel(type: PaymentType) {
  return paymentLabelMap[type]
}

export function formatPaymentStatusLabel(status: PaymentStatus) {
  return status
}

export function formatNaira(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

export function getSuggestedPaymentAmount(
  property: PropertyRecord,
  type: PaymentType,
  booking: BookingRecord | null = null,
) {
  if (type === 'booking_payment') {
    return booking?.estimatedTotal ?? 0
  }

  if (type === 'inspection_fee') {
    return property.inspectionFee
  }

  if (type === 'rent_deposit') {
    return property.cautionFee
  }

  if (type === 'service_fee') {
    return property.agencyFee
  }

  return property.rentPrice
}

export function buildPaymentTypeOptions(
  property: PropertyRecord,
  booking: BookingRecord | null = null,
): PaymentTypeOption[] {
  return (Object.keys(paymentLabelMap) as PaymentType[])
    .filter((type) => type !== 'booking_payment' || Boolean(booking?.estimatedTotal))
    .map((type) => ({
    type,
    label: paymentLabelMap[type],
    description: paymentDescriptionMap[type],
    amount: getSuggestedPaymentAmount(property, type, booking),
  }))
}
