<template>
  <AppShell
    eyebrow="Admin"
    title="Admin dashboard"
    description="A sharper moderation center for listings, verification, payments, bookings, and user oversight."
    :show-bottom-nav="false"
  >
    <section class="grid gap-5">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="metric in metrics"
          :key="metric.label"
          class="metric-card"
        >
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">{{ metric.label }}</p>
          <p class="mt-3 text-3xl font-bold text-ink dark:text-white">{{ metric.value }}</p>
        </article>
      </div>

      <div
        v-if="actionMessage"
        class="rounded-[24px] border px-4 py-4 text-sm"
        :class="actionTone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
          : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'"
      >
        {{ actionMessage }}
      </div>

      <section class="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div class="grid gap-5">
          <div class="hero-shell p-6">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Property moderation</p>
                <h2 class="mt-2 text-xl font-bold text-ink dark:text-white">Pending, approved, and rejected listings</h2>
              </div>
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                :disabled="isRefreshing"
                @click="handleRefresh"
              >
                {{ isRefreshing ? 'Refreshing...' : 'Refresh dashboard' }}
              </button>
            </div>

            <div class="mt-5 grid gap-4">
              <article
                v-for="property in moderatedProperties"
                :key="property.id"
                class="surface-card p-5"
              >
                <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div class="flex flex-wrap items-center gap-3">
                      <h3 class="text-lg font-bold text-ink dark:text-white">{{ property.title }}</h3>
                      <span class="rounded-full px-3 py-1 text-xs font-bold" :class="propertyStatusClassMap[property.status]">
                        {{ property.status }}
                      </span>
                    </div>
                    <p class="mt-2 text-sm text-mist dark:text-slate-300">
                      {{ property.address }}, {{ property.area }}, {{ property.city }}, {{ property.state }}
                    </p>
                    <div class="mt-3 flex flex-wrap gap-3 text-sm text-slate-700 dark:text-slate-200">
                      <span>Owner role: <strong>{{ property.ownerRole }}</strong></span>
                      <span>Availability: <strong>{{ property.isAvailable ? 'Available' : 'Unavailable' }}</strong></span>
                      <span>Rent: <strong>{{ formatCurrency(property.rentPrice) }}</strong></span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
                    <button
                      v-if="property.status !== 'approved'"
                      type="button"
                      class="rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="isProcessing && activePropertyId === property.id"
                      @click="handlePropertyReview(property.id, 'approved')"
                    >
                      {{ isProcessing && activePropertyId === property.id ? 'Working...' : 'Approve listing' }}
                    </button>
                    <button
                      v-if="property.status !== 'rejected'"
                      type="button"
                      class="rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="isProcessing && activePropertyId === property.id"
                      @click="handlePropertyReview(property.id, 'rejected')"
                    >
                      {{ isProcessing && activePropertyId === property.id ? 'Working...' : 'Reject listing' }}
                    </button>
                    <RouterLink
                      :to="`/properties/${property.id}`"
                      class="rounded-full border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      View details
                    </RouterLink>
                  </div>
                </div>
              </article>

              <div
                v-if="!moderatedProperties.length"
                class="rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-mist dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
              >
                No properties are available in the moderation queues yet.
              </div>
            </div>
          </div>

          <div class="glass-panel p-6">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Verification queue</p>
            <div v-if="requests.length" class="mt-5 grid gap-4">
              <article
                v-for="request in requests"
                :key="request.id"
                class="surface-card p-5"
              >
                <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div class="flex items-start gap-4">
                    <img
                      :src="request.profilePhoto.previewUrl"
                      alt="Agent profile"
                      class="h-20 w-20 rounded-[24px] object-cover"
                    >
                    <div>
                      <div class="flex flex-wrap items-center gap-3">
                        <h3 class="text-lg font-bold text-ink dark:text-white">{{ request.fullName }}</h3>
                        <span class="rounded-full px-3 py-1 text-xs font-bold" :class="verificationStatusClassMap[request.status]">
                          {{ formatVerificationStatusLabel(request.status) }}
                        </span>
                      </div>
                      <p class="mt-2 text-sm text-mist dark:text-slate-300">{{ request.officeAddress }}</p>
                      <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">
                        Phone: <strong>{{ request.phone }}</strong> | WhatsApp: <strong>{{ request.whatsappNumber }}</strong>
                      </p>
                      <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Submitted {{ formatDateTime(request.submittedAt) }}</p>
                    </div>
                  </div>

                  <div class="grid gap-2 text-sm">
                    <a
                      class="rounded-full border border-slate-200 bg-white px-4 py-2 text-center font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      :href="request.idDocument.remoteUrl || request.idDocument.previewUrl"
                      :download="request.idDocument.name"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open ID
                    </a>
                    <a
                      v-if="request.cacDocument"
                      class="rounded-full border border-slate-200 bg-white px-4 py-2 text-center font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      :href="request.cacDocument.remoteUrl || request.cacDocument.previewUrl"
                      :download="request.cacDocument.name"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open CAC
                    </a>
                    <a
                      class="rounded-full border border-slate-200 bg-white px-4 py-2 text-center font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      :href="request.authorizationDocument.remoteUrl || request.authorizationDocument.previewUrl"
                      :download="request.authorizationDocument.name"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open authorization
                    </a>
                  </div>
                </div>

                <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                  <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Admin note
                    <textarea
                      v-model="reviewNotes[request.id]"
                      rows="3"
                      class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
                      placeholder="Optional note for approval or required note for rejection."
                    />
                  </label>

                  <div class="flex flex-col gap-3 self-end sm:flex-row lg:flex-col">
                    <button
                      type="button"
                      class="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="isProcessing && activeRequestId === request.id"
                      @click="handleVerificationReview(request.id, 'approved')"
                    >
                      {{ isProcessing && activeRequestId === request.id ? 'Working...' : 'Approve agent' }}
                    </button>
                    <button
                      type="button"
                      class="rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      :disabled="isProcessing && activeRequestId === request.id"
                      @click="handleVerificationReview(request.id, 'rejected')"
                    >
                      {{ isProcessing && activeRequestId === request.id ? 'Working...' : 'Reject agent' }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="request.adminNote"
                  class="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  <span class="font-semibold">Latest review note:</span> {{ request.adminNote }}
                </div>
              </article>
            </div>
            <div
              v-else
              class="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-mist dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
            >
              No verification requests yet.
            </div>
          </div>
        </div>

        <div class="grid gap-5">
          <div class="metric-card">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">User overview</p>
            <div class="mt-5 grid gap-3">
              <article
                v-for="user in userProfiles"
                :key="user.uid"
                class="surface-card px-4 py-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-ink dark:text-white">{{ user.fullName || user.email }}</p>
                    <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ user.email }}</p>
                    <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {{ user.role }}{{ user.isVerifiedAgent ? ' | verified agent' : '' }}
                    </p>
                  </div>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {{ user.verificationStatus.replace(/_/g, ' ') }}
                  </span>
                </div>
              </article>
            </div>
          </div>

          <div class="metric-card">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Recent payments</p>
            <div v-if="payments.length" class="mt-5 grid gap-3">
              <article
                v-for="payment in payments.slice(0, 6)"
                :key="payment.id"
                class="surface-card px-4 py-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-ink dark:text-white">{{ payment.propertyTitle }}</p>
                    <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ payment.paymentType.replace(/_/g, ' ') }}</p>
                  </div>
                  <span class="rounded-full px-3 py-1 text-xs font-bold" :class="paymentStatusClassMap[payment.status]">
                    {{ payment.status }}
                  </span>
                </div>
                <div class="mt-3 grid gap-2 text-sm text-mist dark:text-slate-300">
                  <div>Amount: <span class="font-semibold text-ink dark:text-white">{{ formatCurrency(payment.amount) }}</span></div>
                  <div>Payer: <span class="font-semibold text-ink dark:text-white">{{ payment.payerName }}</span></div>
                  <div>Reference: <span class="font-semibold text-ink dark:text-white">{{ payment.paystackReference }}</span></div>
                </div>
              </article>
            </div>
            <div
              v-else
              class="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-mist dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
            >
              No payment records yet.
            </div>
          </div>

          <div class="metric-card">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Recent bookings</p>
            <div v-if="bookings.length" class="mt-5 grid gap-3">
              <article
                v-for="booking in bookings.slice(0, 6)"
                :key="booking.id"
                class="surface-card px-4 py-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-bold text-ink dark:text-white">{{ propertyTitleMap[booking.propertyId] ?? 'Property unavailable' }}</p>
                    <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ formatDateTime(`${booking.inspectionDate}T${booking.inspectionTime}`) }}</p>
                  </div>
                  <span class="rounded-full px-3 py-1 text-xs font-bold" :class="bookingStatusClassMap[booking.status]">
                    {{ booking.status }}
                  </span>
                </div>
                <div class="mt-3 grid gap-2 text-sm text-mist dark:text-slate-300">
                  <div>Guest phone: <span class="font-semibold text-ink dark:text-white">{{ booking.guestPhone }}</span></div>
                  <div>Payment state: <span class="font-semibold text-ink dark:text-white">{{ booking.paymentStatus }}</span></div>
                  <div>Reminder sent: <span class="font-semibold text-ink dark:text-white">{{ booking.reminderSent ? 'Yes' : 'No' }}</span></div>
                </div>
              </article>
            </div>
            <div
              v-else
              class="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-mist dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
            >
              No booking records yet.
            </div>
          </div>
        </div>
      </section>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import { useAgentVerification } from '../composables/useAgentVerification'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { listAllUserProfiles } from '../services/auth'
import { listBookingsForUser } from '../services/bookings'
import { listPaymentsForUser } from '../services/payments'
import { authMode } from '../lib/firebase'
import { formatVerificationStatusLabel } from '../types/verification'
import type { BookingRecord } from '../types/booking'
import type { PaymentRecord } from '../types/payment'
import type { UserProfile } from '../types/user'

const { state } = useAuth()
const { properties, refresh: refreshProperties, reviewListing } = useProperties()
const { requests, refreshAll, reviewRequest } = useAgentVerification()

const userProfiles = ref<UserProfile[]>([])
const payments = ref<PaymentRecord[]>([])
const bookings = ref<BookingRecord[]>([])
const reviewNotes = reactive<Record<string, string>>({})
const actionMessage = ref('')
const actionTone = ref<'success' | 'error'>('success')
const isProcessing = ref(false)
const isRefreshing = ref(false)
const activeRequestId = ref('')
const activePropertyId = ref('')

const propertyTitleMap = computed(() =>
  properties.value.reduce<Record<string, string>>((result, property) => {
    result[property.id] = property.title
    return result
  }, {}),
)

const metrics = computed(() => [
  { label: 'Pending properties', value: String(properties.value.filter((item) => item.status === 'pending').length).padStart(2, '0') },
  { label: 'Verification queue', value: String(requests.value.filter((item) => item.status === 'pending').length).padStart(2, '0') },
  { label: 'Payments tracked', value: String(payments.value.length).padStart(2, '0') },
  { label: 'Bookings tracked', value: String(bookings.value.length).padStart(2, '0') },
])

const moderatedProperties = computed(() =>
  [...properties.value].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
)

const propertyStatusClassMap = {
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const verificationStatusClassMap = {
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const paymentStatusClassMap = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  failed: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const bookingStatusClassMap = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

onMounted(async () => {
  void handleRefresh()
})

async function handleRefresh() {
  isRefreshing.value = true
  actionMessage.value = ''

  try {
    await refreshProperties()
    await refreshAll()

    const users = await listAllUserProfiles()
    userProfiles.value = users
    payments.value = (await Promise.all(users.map((user) => listPaymentsForUser(user.uid)))).flat()
    bookings.value = (await Promise.all(users.map((user) => listBookingsForUser(user.uid)))).flat()

    for (const request of requests.value) {
      reviewNotes[request.id] = request.adminNote
    }
  } catch (error) {
    actionTone.value = 'error'
    actionMessage.value =
      error instanceof Error ? error.message : 'Could not refresh the admin dashboard.'

    if (authMode !== 'local') {
      actionMessage.value +=
        ' Some admin areas still depend on local-first project data, so this screen now fails closed instead of crashing.'
    }
  } finally {
    isRefreshing.value = false
  }
}

async function handleVerificationReview(verificationId: string, status: 'approved' | 'rejected') {
  if (!state.profile) {
    actionTone.value = 'error'
    actionMessage.value = 'Sign in as an admin before reviewing verification requests.'
    return
  }

  const note = reviewNotes[verificationId] ?? ''

  if (status === 'rejected' && !note.trim()) {
    actionTone.value = 'error'
    actionMessage.value = 'Add an admin note before rejecting a verification request.'
    return
  }

  actionMessage.value = ''
  actionTone.value = 'success'
  isProcessing.value = true
  activeRequestId.value = verificationId

  try {
    const record = await reviewRequest(state.profile, verificationId, status, note)
    reviewNotes[verificationId] = record.adminNote
    actionMessage.value =
      status === 'approved'
        ? 'Agent approved successfully. The verified badge is now active on the profile state.'
        : 'Verification request rejected and the profile status has been updated.'
    await handleRefresh()
  } catch (error) {
    actionTone.value = 'error'
    actionMessage.value =
      error instanceof Error ? error.message : 'Could not review the verification request.'
  } finally {
    isProcessing.value = false
    activeRequestId.value = ''
  }
}

async function handlePropertyReview(propertyId: string, status: 'approved' | 'rejected') {
  if (!state.profile) {
    actionTone.value = 'error'
    actionMessage.value = 'Sign in as an admin before reviewing property listings.'
    return
  }

  actionMessage.value = ''
  actionTone.value = 'success'
  isProcessing.value = true
  activePropertyId.value = propertyId

  try {
    await reviewListing(propertyId, state.profile, status)
    actionMessage.value =
      status === 'approved'
        ? 'Property approved successfully.'
        : 'Property rejected successfully.'
    await handleRefresh()
  } catch (error) {
    actionTone.value = 'error'
    actionMessage.value =
      error instanceof Error ? error.message : 'Could not review the property listing.'
  } finally {
    isProcessing.value = false
    activePropertyId.value = ''
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}
</script>
