<template>
  <AppShell
    eyebrow="My bookings"
    title="Track your scheduled visits"
    description="Your inspection history now shows shared booking records, payment-aware status, and cancellation controls."
  >
    <div
      v-if="message"
      class="rounded-[24px] border px-4 py-4 text-sm"
      :class="messageTone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'"
    >
      {{ message }}
    </div>

    <section v-if="bookingCards.length" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="metric in bookingMetrics"
        :key="metric.label"
        class="metric-card"
      >
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">{{ metric.label }}</p>
        <p class="mt-3 text-3xl font-bold text-ink dark:text-white">{{ metric.value }}</p>
        <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ metric.copy }}</p>
      </article>
    </section>

    <section v-if="bookingCards.length" class="mt-6 grid gap-4 md:grid-cols-2">
      <article
        v-for="item in bookingCards"
        :key="item.booking.id"
        class="glass-panel p-6"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-ink dark:text-white">{{ item.propertyTitle }}</h2>
            <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ item.location }}</p>
          </div>
          <span
            class="status-pill"
            :class="bookingStatusClassMap[item.booking.status]"
          >
            {{ formatBookingStatusLabel(item.booking.status) }}
          </span>
        </div>

        <div class="mt-4 grid gap-2 text-sm text-mist dark:text-slate-300">
          <div>Visit time: <span class="font-semibold text-ink dark:text-white">{{ formatSchedule(item.booking.inspectionDate, item.booking.inspectionTime) }}</span></div>
          <div>
            Payment:
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="paymentStatusClassMap[item.booking.paymentStatus]"
            >
              {{ formatPaymentStatusLabel(item.booking.paymentStatus) }}
            </span>
          </div>
          <div>Guest phone: <span class="font-semibold text-ink dark:text-white">{{ item.booking.guestPhone }}</span></div>
          <div v-if="item.booking.notes">Notes: <span class="font-semibold text-ink dark:text-white">{{ item.booking.notes }}</span></div>
          <div>Reminder flag: <span class="font-semibold text-ink dark:text-white">{{ item.booking.reminderSent ? 'Sent' : 'Pending' }}</span></div>
        </div>

        <div class="mt-5 flex flex-col gap-3 sm:flex-row">
          <RouterLink
            :to="`/properties/${item.booking.propertyId}`"
            class="rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            View property
          </RouterLink>
          <RouterLink
            v-if="item.booking.paymentStatus !== 'success'"
            :to="`/payment/${item.booking.propertyId}?type=inspection_fee`"
            class="rounded-full border border-brand-200 bg-brand-50 px-4 py-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200"
          >
            Complete payment
          </RouterLink>
          <button
            v-if="item.booking.status !== 'cancelled' && item.booking.status !== 'completed'"
            type="button"
            class="rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isLoading"
            @click="handleCancel(item.booking.id)"
          >
            {{ isLoading ? 'Updating...' : 'Cancel booking' }}
          </button>
        </div>
      </article>
    </section>

    <section v-else class="mt-6 glass-panel grid place-items-center p-10 text-center sm:p-14">
      <div class="max-w-md">
        <div class="empty-state-mark">0</div>
        <h2 class="mt-6 text-2xl font-bold text-ink dark:text-white">No bookings yet</h2>
        <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
          Once you schedule an inspection, your visit summary, payment state, and reminder flag will appear here.
        </p>
        <RouterLink
          to="/properties"
          class="mt-6 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Browse properties
        </RouterLink>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import { useAuth } from '../composables/useAuth'
import { useBookings } from '../composables/useBookings'
import { useNotifications } from '../composables/useNotifications'
import { useProperties } from '../composables/useProperties'
import { formatBookingStatusLabel } from '../types/booking'
import { formatPaymentStatusLabel } from '../types/payment'

const { state } = useAuth()
const { bookings, isLoading, refreshForUser, removeBooking } = useBookings()
const { properties, refresh } = useProperties()
const { runReminderScan } = useNotifications()
const route = useRoute()

const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const bookingStatusClassMap = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const paymentStatusClassMap = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  failed: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const bookingCards = computed(() =>
  bookings.value.map((booking) => {
    const property = properties.value.find((item) => item.id === booking.propertyId)

    return {
      booking,
      propertyTitle: property?.title ?? 'Property unavailable',
      location: property
        ? `${property.area}, ${property.city}, ${property.state}`
        : 'This property is no longer available in the current listing feed.',
    }
  }),
)

const bookingMetrics = computed(() => {
  const upcoming = bookings.value.filter(
    (booking) => booking.status !== 'cancelled' && booking.status !== 'completed',
  ).length
  const paid = bookings.value.filter((booking) => booking.paymentStatus === 'success').length
  const reminders = bookings.value.filter((booking) => booking.reminderSent).length

  return [
    { label: 'Total', value: String(bookings.value.length).padStart(2, '0'), copy: 'inspection records' },
    { label: 'Upcoming', value: String(upcoming).padStart(2, '0'), copy: 'active visits' },
    { label: 'Paid', value: String(paid).padStart(2, '0'), copy: 'settled fees' },
    { label: 'Reminded', value: String(reminders).padStart(2, '0'), copy: 'alerts sent' },
  ]
})

watch(
  () => state.profile?.uid,
  async (userId) => {
    await refresh()
    await refreshForUser(userId)

    if (userId) {
      await runReminderScan(userId).catch(() => undefined)
      await refreshForUser(userId)
    }
  },
  { immediate: true },
)

watch(
  () => route.query.notice,
  (notice) => {
    if (notice === 'booking-created') {
      messageTone.value = 'success'
      message.value = 'Inspection booking created successfully.'
    }
  },
  { immediate: true },
)

async function handleCancel(bookingId: string) {
  if (!state.profile) {
    messageTone.value = 'error'
    message.value = 'Sign in before cancelling a booking.'
    return
  }

  try {
    await removeBooking(bookingId, state.profile.uid)
    messageTone.value = 'success'
    message.value = 'Booking cancelled successfully.'
  } catch (error) {
    messageTone.value = 'error'
    message.value = error instanceof Error ? error.message : 'Could not cancel the booking.'
  }
}

function formatSchedule(date: string, time: string) {
  const value = new Date(`${date}T${time}`)

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}
</script>
