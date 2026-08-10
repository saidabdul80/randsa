const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000

function sanitizeIdSegment(value) {
  return (
    String(value || 'none')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 80) || 'none'
  )
}

function buildNotificationId(input) {
  if (input.relatedBookingId) {
    return `notification-${input.type}-${sanitizeIdSegment(input.userId)}-${sanitizeIdSegment(input.relatedBookingId)}`
  }

  if (input.relatedPaymentId) {
    return `notification-${input.type}-${sanitizeIdSegment(input.userId)}-${sanitizeIdSegment(input.relatedPaymentId)}`
  }

  if (input.relatedPropertyId) {
    return `notification-${input.type}-${sanitizeIdSegment(input.userId)}-${sanitizeIdSegment(input.relatedPropertyId)}`
  }

  return `notification-${sanitizeIdSegment(input.type)}-${sanitizeIdSegment(input.userId)}-${Date.now()}`
}

function isBookingEligibleForReminder(data) {
  return Boolean(
    data &&
    String(data.userId || '').trim() &&
    data.reminderSent !== true &&
    data.status !== 'cancelled' &&
    data.status !== 'completed'
  )
}

function isReminderDue(data, bookingStart, now = Date.now()) {
  if (!isBookingEligibleForReminder(data) || !(bookingStart instanceof Date)) return false

  const bookingStartMs = bookingStart.getTime()
  if (!Number.isFinite(bookingStartMs)) return false

  const timeUntilBooking = bookingStartMs - now
  return timeUntilBooking >= 0 && timeUntilBooking <= REMINDER_WINDOW_MS
}

function isStaleMessagingTokenError(error) {
  const code = String(error?.code || '')
  return (
    code.includes('registration-token-not-registered') ||
    code.includes('invalid-registration-token')
  )
}

module.exports = {
  REMINDER_WINDOW_MS,
  buildNotificationId,
  isBookingEligibleForReminder,
  isReminderDue,
  isStaleMessagingTokenError,
  sanitizeIdSegment,
}
