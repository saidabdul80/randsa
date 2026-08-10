const test = require('node:test')
const assert = require('node:assert/strict')

const {
  REMINDER_WINDOW_MS,
  buildNotificationId,
  isBookingEligibleForReminder,
  isReminderDue,
  isStaleMessagingTokenError,
  sanitizeIdSegment,
} = require('../notification-engine')

test('builds stable notification IDs for booking and payment events', () => {
  assert.equal(
    buildNotificationId({
      type: 'inspection_reminder',
      userId: 'user/123',
      relatedBookingId: 'booking/456',
    }),
    'notification-inspection_reminder-user123-booking456'
  )
  assert.equal(
    buildNotificationId({
      type: 'payment_confirmation',
      userId: 'user-123',
      relatedPaymentId: 'payment-456',
    }),
    'notification-payment_confirmation-user-123-payment-456'
  )
})

test('sanitizes notification ID segments and limits their size', () => {
  assert.equal(sanitizeIdSegment('../bad/value'), 'badvalue')
  assert.equal(sanitizeIdSegment('x'.repeat(100)).length, 80)
  assert.equal(sanitizeIdSegment(''), 'none')
})

test('only active, unsent bookings with an owner are reminder eligible', () => {
  assert.equal(isBookingEligibleForReminder({ userId: 'user-1', status: 'pending' }), true)
  assert.equal(
    isBookingEligibleForReminder({ userId: 'user-1', status: 'pending', reminderSent: true }),
    false
  )
  assert.equal(isBookingEligibleForReminder({ userId: 'user-1', status: 'cancelled' }), false)
  assert.equal(isBookingEligibleForReminder({ userId: 'user-1', status: 'completed' }), false)
  assert.equal(isBookingEligibleForReminder({ status: 'pending' }), false)
})

test('accepts booking starts from now through the next 24 hours only', () => {
  const now = Date.UTC(2026, 7, 8, 12, 0, 0)
  const booking = { userId: 'user-1', status: 'pending', reminderSent: false }

  assert.equal(isReminderDue(booking, new Date(now), now), true)
  assert.equal(isReminderDue(booking, new Date(now + REMINDER_WINDOW_MS), now), true)
  assert.equal(isReminderDue(booking, new Date(now - 1), now), false)
  assert.equal(isReminderDue(booking, new Date(now + REMINDER_WINDOW_MS + 1), now), false)
  assert.equal(isReminderDue(booking, new Date('invalid'), now), false)
})

test('recognizes only stale FCM token errors as removable', () => {
  assert.equal(
    isStaleMessagingTokenError({ code: 'messaging/registration-token-not-registered' }),
    true
  )
  assert.equal(isStaleMessagingTokenError({ code: 'messaging/invalid-registration-token' }), true)
  assert.equal(isStaleMessagingTokenError({ code: 'messaging/internal-error' }), false)
  assert.equal(isStaleMessagingTokenError(null), false)
})
