import { computed, ref } from 'vue'

import { cancelBooking, createBooking, getBookingById, listBookingsForUser } from '../services/bookings'
import type { BookingInput, BookingRecord } from '../types/booking'
import type { PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'

const bookings = ref<BookingRecord[]>([])
const isLoading = ref(false)
const error = ref('')

export function useBookings() {
  async function refreshForUser(userId: string | null | undefined) {
    bookings.value = userId ? await listBookingsForUser(userId) : []
    return bookings.value
  }

  async function saveBooking(input: BookingInput, user: UserProfile, property: PropertyRecord) {
    isLoading.value = true
    error.value = ''

    try {
      const booking = await createBooking(input, user, property)
      refreshForUser(user.uid)
      return booking
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not save booking.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function removeBooking(bookingId: string, userId: string) {
    isLoading.value = true
    error.value = ''

    try {
      const booking = await cancelBooking(bookingId, userId)
      refreshForUser(userId)
      return booking
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not cancel the booking.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  return {
    bookings: computed(() => bookings.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    refreshForUser,
    getBookingById,
    saveBooking,
    removeBooking,
  }
}
