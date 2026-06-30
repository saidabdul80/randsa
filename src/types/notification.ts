export type NotificationType =
  | 'inspection_reminder'
  | 'booking_confirmation'
  | 'payment_confirmation'
  | 'rent_due_reminder'
  | 'admin_message'

export type NotificationChannel = 'in_app' | 'browser'

export interface NotificationRecord {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  channel: NotificationChannel
  relatedPropertyId: string | null
  relatedBookingId: string | null
  relatedPaymentId: string | null
  createdAt: string
  deliveredAt: string | null
  readAt: string | null
}

export interface NotificationTokenRecord {
  id: string
  userId: string
  token: string
  device: string
  createdAt: string
}

export function formatNotificationTypeLabel(type: NotificationType) {
  return type.replace(/_/g, ' ')
}
