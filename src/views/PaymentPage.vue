<template>
  <AppShell
    eyebrow="Payment"
    title="Payment center"
    description="Create payment references, open Paystack checkout, and keep verification status visible in one place."
  >
    <section class="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div class="grid gap-5">
        <div class="glass-panel p-6 sm:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Payment setup</p>
              <h2 class="mt-2 text-2xl font-bold text-ink dark:text-white">
                {{ property?.title ?? 'Select a property payment flow' }}
              </h2>
              <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
                <span v-if="property">
                  {{ property.area }}, {{ property.city }}, {{ property.state }}
                </span>
                <span v-else>
                  Open this page from a property to create a payment reference tied to a listing.
                </span>
              </p>
            </div>
            <div v-if="property" class="text-right">
              <p class="text-2xl font-bold text-ink dark:text-white">{{ formatNaira(property.rentPrice) }}</p>
              <p class="mt-1 text-sm text-mist dark:text-slate-300">per {{ property.paymentDuration }}</p>
            </div>
          </div>

          <div
            v-if="setupMessage"
            class="mt-5 rounded-[22px] border px-4 py-4 text-sm"
            :class="setupTone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'"
          >
            {{ setupMessage }}
          </div>

          <div class="mt-6 grid gap-4">
            <button
              v-for="option in paymentOptions"
              :key="option.type"
              type="button"
              class="rounded-[24px] border px-5 py-5 text-left transition"
              :class="selectedType === option.type
                ? 'border-brand-400 bg-brand-50/70 dark:border-brand-500 dark:bg-brand-500/10'
                : 'border-slate-200 bg-white/80 hover:border-brand-200 dark:border-slate-800 dark:bg-slate-950/60'"
              @click="selectedType = option.type"
            >
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 class="text-base font-bold text-ink dark:text-white">{{ option.label }}</h3>
                  <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">{{ option.description }}</p>
                </div>
                <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700 dark:bg-slate-900 dark:text-brand-200">
                  {{ formatNaira(option.amount) }}
                </span>
              </div>
            </button>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Payment amount
              <input
                v-model.number="amount"
                type="number"
                min="0"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
              >
            </label>
            <div class="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200">
              <p class="font-semibold">Reference mode</p>
              <p class="mt-2 leading-6">
                {{ isLocalPaymentBypassEnabled
                  ? 'Local payment bypass is active. You can simulate Paystack success or failure after creating a pending record.'
                  : 'Live payment mode is active. Create a pending reference, open Paystack checkout, and verify the result before the payment is marked successful.' }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              @click="resetSuggestedAmount"
            >
              Reset suggested amount
            </button>
            <button
              type="button"
              class="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!property || !state.profile || isStartingPayment"
              @click="handleCreatePayment"
            >
              {{ isStartingPayment ? 'Creating reference...' : 'Create payment reference' }}
            </button>
          </div>
        </div>

        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Payment flow</p>
          <div class="mt-4 grid gap-3 text-sm text-mist dark:text-slate-300">
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 dark:bg-slate-950/60">1. Choose the payment type and confirm the amount.</div>
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 dark:bg-slate-950/60">2. Create a reference and continue through Paystack checkout.</div>
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 dark:bg-slate-950/60">3. Verify the reference so the payment status updates in your account.</div>
          </div>
        </div>
      </div>

      <div class="grid gap-5">
        <div class="glass-panel p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Current payment</p>
              <h3 class="mt-2 text-xl font-bold text-ink dark:text-white">
                {{ activePayment ? formatPaymentTypeLabel(activePayment.paymentType) : 'No active payment yet' }}
              </h3>
            </div>
            <span
              v-if="activePayment"
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="statusClassMap[activePayment.status]"
            >
              {{ formatPaymentStatusLabel(activePayment.status) }}
            </span>
          </div>

          <div v-if="activePayment" class="mt-5 grid gap-3 text-sm text-mist dark:text-slate-300">
            <div>Reference: <span class="font-semibold text-ink dark:text-white">{{ activePayment.paystackReference }}</span></div>
            <div>Amount: <span class="font-semibold text-ink dark:text-white">{{ formatNaira(activePayment.amount) }}</span></div>
            <div>Verification mode: <span class="font-semibold text-ink dark:text-white">{{ activePayment.verificationMode.replace('_', ' ') }}</span></div>
            <div>Created: <span class="font-semibold text-ink dark:text-white">{{ formatDateTime(activePayment.createdAt) }}</span></div>
            <div v-if="activePayment.verifiedAt">Verified: <span class="font-semibold text-ink dark:text-white">{{ formatDateTime(activePayment.verifiedAt) }}</span></div>
            <div v-if="activePayment.gatewayStatus">Gateway status: <span class="font-semibold text-ink dark:text-white">{{ activePayment.gatewayStatus }}</span></div>
            <div v-if="activePayment.gatewayVerifiedAt">Gateway checked: <span class="font-semibold text-ink dark:text-white">{{ formatDateTime(activePayment.gatewayVerifiedAt) }}</span></div>
          </div>

          <div v-if="activePayment" class="mt-5 grid gap-3">
            <button
              v-if="!isLocalPaymentBypassEnabled && activePayment.status === 'pending'"
              type="button"
              class="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isCompletingPayment || !state.profile"
              @click="handleOpenPaystackCheckout"
            >
              {{ isCompletingPayment ? 'Working...' : 'Open Paystack checkout' }}
            </button>
            <button
              v-if="isLocalPaymentBypassEnabled && activePayment.status === 'pending'"
              type="button"
              class="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isCompletingPayment"
              @click="handleCompletePayment('success')"
            >
              {{ isCompletingPayment ? 'Updating...' : 'Simulate successful Paystack payment' }}
            </button>
            <button
              v-if="isLocalPaymentBypassEnabled && activePayment.status === 'pending'"
              type="button"
              class="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isCompletingPayment"
              @click="handleCompletePayment('failed')"
            >
              {{ isCompletingPayment ? 'Updating...' : 'Simulate failed payment' }}
            </button>
            <button
              v-if="!isLocalPaymentBypassEnabled && activePayment.status === 'pending'"
              type="button"
              class="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              :disabled="isCompletingPayment || !state.profile"
              @click="handleVerifyPendingPayment"
            >
              {{ isCompletingPayment ? 'Verifying...' : 'Verify pending payment' }}
            </button>
            <div
              v-if="!isLocalPaymentBypassEnabled"
              class="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
            >
              Live payments must be confirmed through Paystack verification before the record becomes successful.
            </div>
            <RouterLink
              v-if="property && activePayment.paymentType === 'inspection_fee' && activePayment.status === 'success'"
              :to="`/booking/${property.id}`"
              class="rounded-full bg-ink px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Continue to booking
            </RouterLink>
          </div>
        </div>

        <div class="glass-panel p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Recent payments</p>
              <h3 class="mt-2 text-xl font-bold text-ink dark:text-white">Your payment history</h3>
            </div>
            <div class="text-right text-xs text-slate-500 dark:text-slate-400">
              <div>Paystack key</div>
              <div class="mt-1 font-semibold text-ink dark:text-white">
                {{ paystackPublicKey ? 'Configured' : 'Not configured yet' }}
              </div>
            </div>
          </div>

          <div v-if="recentPayments.length" class="mt-5 grid gap-3">
            <article
              v-for="payment in recentPayments"
              :key="payment.id"
              class="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-bold text-ink dark:text-white">{{ payment.propertyTitle }}</p>
                  <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ formatPaymentTypeLabel(payment.paymentType) }}</p>
                </div>
                <span
                  class="rounded-full px-3 py-1 text-xs font-bold"
                  :class="statusClassMap[payment.status]"
                >
                  {{ formatPaymentStatusLabel(payment.status) }}
                </span>
              </div>
              <div class="mt-3 grid gap-2 text-sm text-mist dark:text-slate-300">
                <div>Amount: <span class="font-semibold text-ink dark:text-white">{{ formatNaira(payment.amount) }}</span></div>
                <div>Reference: <span class="font-semibold text-ink dark:text-white">{{ payment.paystackReference }}</span></div>
                <div>Created: <span class="font-semibold text-ink dark:text-white">{{ formatDateTime(payment.createdAt) }}</span></div>
              </div>
              <button
                v-if="property && payment.propertyId === property.id && payment.status === 'pending'"
                type="button"
                class="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                @click="activePayment = payment"
              >
                Resume this pending payment
              </button>
            </article>
          </div>
          <div
            v-else
            class="mt-5 rounded-[22px] border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-sm text-mist dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
          >
            No payments yet. Create the first payment reference from this page.
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import { useAuth } from '../composables/useAuth'
import { useBookings } from '../composables/useBookings'
import { useNotifications } from '../composables/useNotifications'
import { usePayments } from '../composables/usePayments'
import { useProperties } from '../composables/useProperties'
import { isLocalPaymentBypassEnabled, paystackPublicKey } from '../lib/payments'
import { openPaystackCheckout } from '../lib/paystack'
import {
  buildPaymentTypeOptions,
  formatNaira,
  formatPaymentStatusLabel,
  formatPaymentTypeLabel,
  getSuggestedPaymentAmount,
  type PaymentRecord,
  type PaymentType,
} from '../types/payment'

const route = useRoute()
const propertyId = computed(() => (route.params.propertyId as string | undefined) ?? '')
const bookingId = computed(() => (typeof route.query.bookingId === 'string' ? route.query.bookingId : ''))
const { state } = useAuth()
const { getBookingById } = useBookings()
const { findById } = useProperties()
const { payments, isLoading, refreshForUser, startPayment, finishLocalPayment, verifyPayment } = usePayments()
const { addPaymentConfirmation } = useNotifications()

const property = ref<Awaited<ReturnType<typeof findById>>>(null)
const selectedBooking = ref<Awaited<ReturnType<typeof getBookingById>>>(null)
const selectedType = ref<PaymentType>('inspection_fee')
const amount = ref(0)
const activePayment = ref<PaymentRecord | null>(null)
const setupMessage = ref('')
const setupTone = ref<'success' | 'error'>('success')

const paymentTypeValues: PaymentType[] = [
  'inspection_fee',
  'rent_deposit',
  'full_rent_payment',
  'service_fee',
  'booking_payment',
]

const paymentOptions = computed(() =>
  property.value ? buildPaymentTypeOptions(property.value, selectedBooking.value) : [],
)
const recentPayments = computed(() => payments.value.slice(0, 6))
const isStartingPayment = computed(() => isLoading.value && !activePayment.value)
const isCompletingPayment = computed(() => isLoading.value && Boolean(activePayment.value))

const statusClassMap = {
  approved: '',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  failed: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

watch(
  [propertyId, bookingId, () => state.profile?.uid],
  async ([value, currentBookingId, userId]) => {
    property.value = value ? await findById(value) : null
    selectedBooking.value = currentBookingId && userId ? await getBookingById(currentBookingId) : null

    if (selectedBooking.value && selectedBooking.value.propertyId !== value) {
      selectedBooking.value = null
      setupTone.value = 'error'
      setupMessage.value = 'The selected booking does not belong to this listing.'
    }
    resetSuggestedAmount()

    if (value && state.profile) {
      const pending = payments.value.find(
        (payment) =>
          payment.propertyId === value &&
          payment.status === 'pending' &&
          (!currentBookingId || payment.bookingId === currentBookingId),
      )

      activePayment.value = pending ?? null
    } else {
      activePayment.value = null
    }
  },
  { immediate: true },
)

watch(
  () => route.query.type,
  (queryValue) => {
    if (typeof queryValue === 'string' && paymentTypeValues.includes(queryValue as PaymentType)) {
      selectedType.value = queryValue as PaymentType
      resetSuggestedAmount()
    }
  },
  { immediate: true },
)

watch(
  () => state.profile?.uid,
  (userId) => {
    void refreshForUser(userId)
  },
  { immediate: true },
)

watch(
  payments,
  (items) => {
    if (!property.value) {
      return
    }

    if (!activePayment.value || activePayment.value.status !== 'pending') {
      activePayment.value =
        items.find(
          (payment) =>
            payment.propertyId === property.value?.id
            && payment.status === 'pending'
            && (!bookingId.value || payment.bookingId === bookingId.value),
        ) ??
        activePayment.value
    }
  },
)

async function handleCreatePayment() {
  if (!state.profile) {
    setupTone.value = 'error'
    setupMessage.value = 'Sign in before creating a payment reference.'
    return
  }

  if (!property.value) {
    setupTone.value = 'error'
    setupMessage.value = 'Open the payment page from a property before creating a payment reference.'
    return
  }

  if (amount.value <= 0) {
    setupTone.value = 'error'
    setupMessage.value = 'Use an amount greater than zero before creating the payment reference.'
    return
  }

  setupMessage.value = ''

  try {
    const payment = await startPayment(
      state.profile,
      property.value,
      selectedType.value,
      amount.value,
      selectedType.value === 'booking_payment' ? selectedBooking.value?.id ?? null : null,
    )
    activePayment.value = payment
    setupTone.value = 'success'
    setupMessage.value = isLocalPaymentBypassEnabled
      ? 'Pending payment created. You can now simulate a Paystack success or failure locally.'
      : 'Pending payment created. You can now open Paystack checkout or verify the reference after an external payment attempt.'
  } catch (caughtError) {
    setupTone.value = 'error'
    setupMessage.value =
      caughtError instanceof Error ? caughtError.message : 'Could not create the payment reference.'
  }
}

async function handleCompletePayment(status: 'success' | 'failed') {
  if (!state.profile || !activePayment.value) {
    setupTone.value = 'error'
    setupMessage.value = 'Create or resume a payment before completing it.'
    return
  }

  try {
    activePayment.value = await finishLocalPayment(activePayment.value.id, state.profile.uid, status)
    let notificationNotice = ''

    try {
      await addPaymentConfirmation(state.profile, activePayment.value)
    } catch {
      notificationNotice = ' The payment changed successfully, but the notification could not be synced yet.'
    }

    setupTone.value = 'success'
    setupMessage.value =
      status === 'success'
        ? `Local payment marked successful.${notificationNotice}`
        : `Local payment marked failed for testing.${notificationNotice}`
  } catch (caughtError) {
    setupTone.value = 'error'
    setupMessage.value =
      caughtError instanceof Error ? caughtError.message : 'Could not update the payment status.'
  }
}

async function handleOpenPaystackCheckout() {
  if (!state.profile || !activePayment.value || !property.value) {
    setupTone.value = 'error'
    setupMessage.value = 'Create or resume a payment before opening Paystack checkout.'
    return
  }

  setupMessage.value = ''

  try {
    const result = await openPaystackCheckout({
      email: state.profile.email,
      amount: activePayment.value.amount,
      reference: activePayment.value.paystackReference,
      metadata: {
        paymentId: activePayment.value.id,
        propertyId: property.value.id,
        paymentType: activePayment.value.paymentType,
        bookingId: activePayment.value.bookingId,
        userId: state.profile.uid,
      },
    })

    activePayment.value = await verifyPayment(
      activePayment.value.id,
      state.profile.uid,
      result.reference,
    )

    let notificationNotice = ''

    try {
      await addPaymentConfirmation(state.profile, activePayment.value)
    } catch {
      notificationNotice = ' Payment verification succeeded, but the notification could not be synced yet.'
    }

    setupTone.value = 'success'
    setupMessage.value =
      activePayment.value.status === 'success'
        ? `Paystack payment verified successfully.${notificationNotice}`
        : `The payment was checked, but Paystack did not confirm success.${notificationNotice}`
  } catch (caughtError) {
    setupTone.value = 'error'
    setupMessage.value =
      caughtError instanceof Error ? caughtError.message : 'Could not complete the Paystack checkout flow.'
  }
}

async function handleVerifyPendingPayment() {
  if (!state.profile || !activePayment.value) {
    setupTone.value = 'error'
    setupMessage.value = 'Create or resume a payment before verifying it.'
    return
  }

  setupMessage.value = ''

  try {
    activePayment.value = await verifyPayment(
      activePayment.value.id,
      state.profile.uid,
      activePayment.value.paystackReference,
    )

    let notificationNotice = ''

    if (activePayment.value.status === 'success') {
      try {
        await addPaymentConfirmation(state.profile, activePayment.value)
      } catch {
        notificationNotice = ' The payment was verified, but the notification could not be synced yet.'
      }
    }

    setupTone.value = activePayment.value.status === 'success' ? 'success' : 'error'
    setupMessage.value =
      activePayment.value.status === 'success'
        ? `Pending payment verified successfully.${notificationNotice}`
        : 'Paystack verification completed, but the transaction was not marked successful.'
  } catch (caughtError) {
    setupTone.value = 'error'
    setupMessage.value =
      caughtError instanceof Error ? caughtError.message : 'Could not verify the pending payment.'
  }
}

function resetSuggestedAmount() {
  amount.value = property.value
    ? getSuggestedPaymentAmount(property.value, selectedType.value, selectedBooking.value)
    : 0
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>
