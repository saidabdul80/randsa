import { computed, ref } from 'vue'

import {
  createBookingConfirmationNotification,
  createPaymentConfirmationNotification,
  listNotificationsForUser,
  listNotificationTokensForUser,
  markNotificationAsRead,
  registerNotificationToken,
  requestBrowserNotificationPermission,
  runInspectionReminderScan,
} from '../services/notifications'
import type { BookingRecord } from '../types/booking'
import type { NotificationRecord, NotificationTokenRecord } from '../types/notification'
import type { PaymentRecord } from '../types/payment'
import type { PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'

const notifications = ref<NotificationRecord[]>([])
const tokens = ref<NotificationTokenRecord[]>([])
const isLoading = ref(false)
const error = ref('')

export function useNotifications() {
  async function refreshForUser(userId: string | null | undefined) {
    notifications.value = userId ? await listNotificationsForUser(userId) : []
    tokens.value = userId ? await listNotificationTokensForUser(userId) : []
    return notifications.value
  }

  async function enableBrowserNotifications(userId: string) {
    isLoading.value = true
    error.value = ''

    try {
      const permission = await requestBrowserNotificationPermission()

      if (permission !== 'granted') {
        throw new Error('Browser notification permission was not granted.')
      }

      const token = await registerNotificationToken(userId)
      await refreshForUser(userId)
      return token
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not enable browser notifications.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function addBookingConfirmation(
    user: UserProfile,
    booking: BookingRecord,
    property: PropertyRecord
  ) {
    isLoading.value = true
    error.value = ''

    try {
      const notification = await createBookingConfirmationNotification(user, booking, property)
      await refreshForUser(user.uid)
      return notification
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not create booking confirmation notification.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function addPaymentConfirmation(user: UserProfile, payment: PaymentRecord) {
    isLoading.value = true
    error.value = ''

    try {
      const notification = await createPaymentConfirmationNotification(user, payment)
      await refreshForUser(user.uid)
      return notification
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not create payment confirmation notification.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function markRead(notificationId: string, userId: string) {
    isLoading.value = true
    error.value = ''

    try {
      const notification = await markNotificationAsRead(notificationId, userId)
      await refreshForUser(userId)
      return notification
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not mark notification as read.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function runReminderScan(userId: string) {
    isLoading.value = true
    error.value = ''

    try {
      const created = await runInspectionReminderScan(userId)
      await refreshForUser(userId)
      return created
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not run reminder scan.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  return {
    notifications: computed(() => notifications.value),
    tokens: computed(() => tokens.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    refreshForUser,
    enableBrowserNotifications,
    addBookingConfirmation,
    addPaymentConfirmation,
    markRead,
    runReminderScan,
  }
}
