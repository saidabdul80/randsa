<template>
  <AppShell
    eyebrow="Booking"
    title="Inspection booking"
    description="Choose a visit time, confirm your contact details, and keep payment status visible before you book."
  >
    <section class="grid gap-5 lg:grid-cols-[1fr_0.92fr]">
      <div class="glass-panel p-6 sm:p-8">
        <h2 class="text-xl font-bold text-ink dark:text-white">Schedule an inspection</h2>
        <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
          Choose a visit date and time, confirm your contact number, and save the inspection request.
        </p>

        <div
          v-if="message"
          class="mt-5 rounded-[22px] border px-4 py-4 text-sm"
          :class="messageTone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'"
        >
          {{ message }}
        </div>

        <form class="mt-6 grid gap-5" @submit.prevent="handleSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Inspection date
              <input
                v-model="form.inspectionDate"
                type="date"
                :min="minimumDate"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
              >
            </label>
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Inspection time
              <input
                v-model="form.inspectionTime"
                type="time"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
              >
            </label>
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Guest phone
              <input
                v-model="form.guestPhone"
                type="tel"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
                placeholder="+234..."
              >
            </label>
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
              <p class="font-semibold">Inspection fee status</p>
              <p class="mt-2 leading-6">
                {{ paymentStatusMessage }}
              </p>
            </div>
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
              Notes
              <textarea
                v-model="form.notes"
                rows="4"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Gate description, meeting notes, or any request for the landlord or agent."
              />
            </label>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <RouterLink
              v-if="property"
              :to="`/payment/${property.id}?type=inspection_fee`"
              class="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Manage inspection payment
            </RouterLink>
            <button
              type="submit"
              class="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!property || !state.profile || isLoading"
            >
              {{ isLoading ? 'Saving booking...' : 'Book inspection' }}
            </button>
          </div>
        </form>
      </div>

      <div class="grid gap-4">
        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Property summary</p>
          <template v-if="property">
            <h3 class="mt-2 text-xl font-bold text-ink dark:text-white">{{ property.title }}</h3>
            <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
              {{ property.address }}, {{ property.area }}, {{ property.city }}, {{ property.state }}
            </p>
            <div class="mt-5 grid gap-3 text-sm text-mist dark:text-slate-300">
              <div>Inspection fee: <span class="font-semibold text-ink dark:text-white">{{ formatNaira(property.inspectionFee) }}</span></div>
              <div>Agent or landlord: <span class="font-semibold text-ink dark:text-white">{{ property.ownerRole }}</span></div>
              <div>Contact phone: <span class="font-semibold text-ink dark:text-white">{{ property.ownerPhone }}</span></div>
            </div>
          </template>
          <template v-else>
            <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
              Open this page from a property listing to create a booking tied to that property.
            </p>
          </template>
        </div>

        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Latest payment state</p>
          <div v-if="latestInspectionPayment" class="mt-4 grid gap-3 text-sm text-mist dark:text-slate-300">
            <div>Reference: <span class="font-semibold text-ink dark:text-white">{{ latestInspectionPayment.paystackReference }}</span></div>
            <div>Amount: <span class="font-semibold text-ink dark:text-white">{{ formatNaira(latestInspectionPayment.amount) }}</span></div>
            <div>
              Status:
              <span
                class="status-pill"
                :class="paymentStatusClassMap[latestInspectionPayment.status]"
              >
                {{ formatPaymentStatusLabel(latestInspectionPayment.status) }}
              </span>
            </div>
          </div>
          <p v-else class="mt-4 text-sm leading-7 text-mist dark:text-slate-300">
            No inspection payment record found yet. You can still save the booking now, but it will remain tied to a pending payment status until you complete the inspection fee flow.
          </p>
        </div>

        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Reminder note</p>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Inspection reminders are sent when an upcoming visit is due, so you do not need to keep checking the schedule manually.
          </p>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import { useAuth } from '../composables/useAuth'
import { useBookings } from '../composables/useBookings'
import { useNotifications } from '../composables/useNotifications'
import { usePayments } from '../composables/usePayments'
import { useProperties } from '../composables/useProperties'
import {
  createEmptyBookingInput,
  type BookingInput,
} from '../types/booking'
import { formatNaira, formatPaymentStatusLabel } from '../types/payment'

const route = useRoute()
const router = useRouter()
const propertyId = computed(() => (route.params.propertyId as string | undefined) ?? '')

const { state } = useAuth()
const { findById } = useProperties()
const { isLoading, saveBooking } = useBookings()
const { findLatestPaymentForUserProperty } = usePayments()
const { addBookingConfirmation } = useNotifications()

const property = ref<Awaited<ReturnType<typeof findById>>>(null)
const latestInspectionPayment = ref<Awaited<ReturnType<typeof findLatestPaymentForUserProperty>>>(null)
const form = reactive<BookingInput>(createEmptyBookingInput())
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const minimumDate = new Date().toISOString().slice(0, 10)

const paymentStatusClassMap = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  failed: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const paymentStatusMessage = computed(() => {
  if (!latestInspectionPayment.value) {
    return 'No inspection payment yet. The booking will be created with pending payment status.'
  }

  if (latestInspectionPayment.value.status === 'success') {
    return 'Inspection fee already paid successfully. Your booking will carry a paid payment status.'
  }

  if (latestInspectionPayment.value.status === 'failed') {
    return 'The latest inspection payment failed. You can still save the booking, but payment status will remain failed until you try again.'
  }

  return 'An inspection payment reference exists but is still pending verification.'
})

watch(
  () => state.profile,
  (profile) => {
    if (!profile) {
      return
    }

    form.guestPhone = form.guestPhone || profile.phone
  },
  { immediate: true },
)

watch(
  [propertyId, () => state.profile?.uid],
  async ([currentPropertyId, userId]) => {
    property.value = currentPropertyId ? await findById(currentPropertyId) : null
    latestInspectionPayment.value =
      currentPropertyId && userId
        ? await findLatestPaymentForUserProperty(userId, currentPropertyId, 'inspection_fee')
        : null
  },
  { immediate: true },
)

async function handleSubmit() {
  if (!state.profile) {
    messageTone.value = 'error'
    message.value = 'Sign in before creating an inspection booking.'
    return
  }

  if (!property.value) {
    messageTone.value = 'error'
    message.value = 'Open the booking page from a property before saving a booking.'
    return
  }

  message.value = ''

  try {
    const booking = await saveBooking({ ...form }, state.profile, property.value)
    let notificationNotice = ''

    try {
      await addBookingConfirmation(state.profile, booking, property.value)
    } catch {
      notificationNotice = ' Booking saved, but the confirmation notification could not be synced yet.'
    }

    messageTone.value = 'success'
    message.value =
      booking.paymentStatus === 'success'
        ? `Inspection booking created with successful payment status.${notificationNotice}`
        : `Inspection booking created. Payment is still not fully settled, so the booking remains pending.${notificationNotice}`
    await router.replace('/my-bookings?notice=booking-created')
  } catch (error) {
    messageTone.value = 'error'
    message.value = error instanceof Error ? error.message : 'Could not create the booking.'
  }
}
</script>
