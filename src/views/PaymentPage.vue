<template>
  <AppShell :show-header="false" :show-bottom-nav="false" content-class="min-h-full w-full">
    <div class="payment-workspace">
      <aside class="payment-sidebar" aria-label="Payment Center navigation">
        <RouterLink to="/home" class="payment-brand" aria-label="RANDSA home">
          <span aria-hidden="true">R</span>
          <strong>RANDSA</strong>
        </RouterLink>

        <nav class="payment-nav" aria-label="Primary navigation">
          <RouterLink
            v-for="item in paymentNavigationItems"
            :key="item.label"
            :to="item.to"
            class="payment-nav__link"
            :class="{ 'is-active': isPaymentNavActive(item.matchers) }"
          >
            <IonIcon :icon="item.icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <RouterLink to="/profile" class="payment-account-card" aria-label="Open Account Center">
          <img
            v-if="state.profile?.photoURL"
            :src="state.profile.photoURL"
            :alt="`${state.profile.fullName} profile`"
            loading="lazy"
            decoding="async"
          />
          <span v-else class="payment-account-card__avatar" aria-hidden="true">{{
            profileInitial
          }}</span>
          <span class="payment-account-card__copy">
            <strong>{{ state.profile?.fullName || 'RANDSA account' }}</strong>
            <small>{{ profileRoleLabel }}</small>
          </span>
          <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
        </RouterLink>
      </aside>

      <main class="payment-main">
        <header class="payment-header" aria-labelledby="payment-page-title">
          <div>
            <p class="payment-breadcrumb"><span>RANDSA</span> / PAYMENT</p>
            <div class="payment-title-row">
              <h1 id="payment-page-title">Payment center</h1>
              <span class="payment-title-icon" aria-hidden="true">
                <IonIcon :icon="shieldCheckmarkOutline" />
              </span>
            </div>
            <p>
              Create payment references, complete secure Paystack checkout, and track verification
              status in one place.
            </p>
          </div>
          <div
            class="paystack-security"
            aria-label="Paystack checkout is configured for this payment flow"
          >
            <IonIcon :icon="lockClosedOutline" aria-hidden="true" />
            <span>Secured by <strong>Paystack</strong></span>
          </div>
        </header>

        <div
          v-if="setupMessage"
          class="payment-notice"
          :class="setupTone === 'success' ? 'is-success' : 'is-error'"
          role="status"
          aria-live="polite"
        >
          <IonIcon
            :icon="setupTone === 'success' ? checkmarkCircleOutline : alertCircleOutline"
            aria-hidden="true"
          />
          <span>{{ setupMessage }}</span>
          <button type="button" aria-label="Dismiss payment message" @click="setupMessage = ''">
            <IonIcon :icon="closeCircleOutline" aria-hidden="true" />
          </button>
        </div>

        <section class="payment-dashboard" aria-label="Payment setup and current status">
          <article id="payment-setup" class="payment-card payment-setup-card">
            <div class="payment-card__heading">
              <div>
                <p class="payment-eyebrow">Payment setup</p>
                <h2>Create a payment reference</h2>
                <span
                  >Select a property and enter the amount to generate a secure payment
                  reference.</span
                >
              </div>
              <span class="payment-heading-icon is-blue" aria-hidden="true">
                <IonIcon :icon="cardOutline" />
              </span>
            </div>

            <div class="payment-setup-layout">
              <form class="payment-form" novalidate @submit.prevent="handleCreatePayment">
                <label class="payment-field">
                  <span>Select property</span>
                  <span class="payment-select-wrap">
                    <IonIcon :icon="businessOutline" aria-hidden="true" />
                    <select
                      v-model="selectedPropertyId"
                      :disabled="arePropertiesLoading"
                      aria-describedby="property-field-hint"
                      @change="handlePropertySelection"
                    >
                      <option value="">Select a property</option>
                      <option v-for="item in propertyChoices" :key="item.id" :value="item.id">
                        {{ item.title }} - {{ item.city || item.state }}
                      </option>
                    </select>
                    <IonSpinner
                      v-if="arePropertiesLoading"
                      name="crescent"
                      aria-label="Loading properties"
                    />
                  </span>
                </label>

                <div v-if="property" class="selected-property" aria-live="polite">
                  <div class="selected-property__media">
                    <img
                      v-if="selectedPropertyImage"
                      :src="selectedPropertyImage"
                      :alt="`${property.title} property`"
                      loading="lazy"
                      decoding="async"
                    />
                    <IonIcon v-else :icon="businessOutline" aria-hidden="true" />
                  </div>
                  <div>
                    <strong>{{ property.title }}</strong>
                    <span>{{ propertyLocation }}</span>
                    <small
                      >Suggested rent: {{ formatNaira(property.rentPrice) }} /
                      {{ property.paymentDuration }}</small
                    >
                  </div>
                </div>

                <p
                  v-if="propertyError"
                  id="property-field-hint"
                  class="payment-field-error"
                  role="alert"
                >
                  {{ propertyError }}
                </p>
                <p v-else-if="!property" id="property-field-hint" class="payment-field-hint">
                  Choose an approved, available listing or open this page from a property or
                  booking.
                </p>

                <label class="payment-field">
                  <span>Payment type</span>
                  <span class="payment-select-wrap">
                    <IonIcon :icon="walletOutline" aria-hidden="true" />
                    <select v-model="selectedType" :disabled="!property">
                      <option
                        v-for="option in paymentOptions"
                        :key="option.type"
                        :value="option.type"
                      >
                        {{ option.label }} - {{ formatNaira(option.amount) }}
                      </option>
                    </select>
                  </span>
                </label>

                <label class="payment-field">
                  <span>Payment amount (NGN)</span>
                  <span class="payment-amount-wrap" :class="{ 'has-error': amountError }">
                    <span aria-hidden="true">&#8358;</span>
                    <input
                      v-model="formattedAmountInput"
                      inputmode="decimal"
                      autocomplete="off"
                      placeholder="0.00"
                      aria-describedby="payment-amount-hint"
                      :aria-invalid="Boolean(amountError)"
                    />
                  </span>
                </label>
                <p
                  v-if="amountError"
                  id="payment-amount-hint"
                  class="payment-field-error"
                  role="alert"
                >
                  {{ amountError }}
                </p>
                <p v-else id="payment-amount-hint" class="payment-field-hint">
                  The exact amount is saved only when you create the reference.
                </p>

                <div class="payment-form__actions">
                  <button
                    type="button"
                    class="payment-button is-secondary"
                    :disabled="!property || isStartingPayment"
                    @click="resetSuggestedAmount"
                  >
                    <IonIcon :icon="refreshOutline" aria-hidden="true" />
                    Reset suggested amount
                  </button>
                  <button
                    type="submit"
                    class="payment-button is-primary"
                    :disabled="
                      !property || !state.profile || isStartingPayment || Boolean(amountError)
                    "
                  >
                    <IonSpinner v-if="isStartingPayment" name="crescent" aria-hidden="true" />
                    <span>{{
                      isStartingPayment ? 'Creating reference...' : 'Create payment reference'
                    }}</span>
                    <IonIcon
                      v-if="!isStartingPayment"
                      :icon="arrowForwardOutline"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </form>

              <aside class="payment-how" aria-labelledby="payment-how-title">
                <div>
                  <IonIcon :icon="informationCircleOutline" aria-hidden="true" />
                  <h3 id="payment-how-title">How it works</h3>
                </div>
                <ol>
                  <li v-for="(step, index) in howItWorks" :key="step">
                    <span>{{ index + 1 }}</span>
                    <p>{{ step }}</p>
                  </li>
                </ol>
              </aside>
            </div>
          </article>

          <article
            class="payment-card current-payment-card"
            aria-labelledby="current-payment-title"
          >
            <div class="payment-card__heading">
              <div>
                <p class="payment-eyebrow">Current payment status</p>
                <h2 id="current-payment-title">
                  {{
                    currentPayment
                      ? formatPaymentTypeLabel(currentPayment.paymentType)
                      : 'No active payment yet'
                  }}
                </h2>
                <span>
                  {{
                    currentPayment
                      ? currentPayment.propertyTitle
                      : 'Create a payment reference to get started.'
                  }}
                </span>
              </div>
              <span
                v-if="currentPayment"
                class="payment-status"
                :class="statusClassMap[currentPayment.status]"
              >
                <IonIcon :icon="statusIconMap[currentPayment.status]" aria-hidden="true" />
                {{ formatPaymentStatusLabel(currentPayment.status) }}
              </span>
            </div>

            <div v-if="!currentPayment" class="payment-empty-visual" aria-hidden="true">
              <span><IonIcon :icon="walletOutline" /></span>
              <i><IonIcon :icon="addCircleOutline" /></i>
            </div>

            <dl class="payment-summary" aria-live="polite">
              <div>
                <dt>Reference</dt>
                <dd :title="currentPayment?.paystackReference || ''">
                  {{ currentPayment?.paystackReference || '—' }}
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{{ currentPayment ? formatNaira(currentPayment.amount) : '—' }}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  {{ currentPayment ? formatPaymentStatusLabel(currentPayment.status) : '—' }}
                </dd>
              </div>
              <div>
                <dt>Expires in</dt>
                <dd>—</dd>
              </div>
            </dl>

            <dl v-if="currentPayment" class="current-payment-details">
              <div>
                <dt>Property</dt>
                <dd>{{ currentPayment.propertyTitle }}</dd>
              </div>
              <div>
                <dt>Payment type</dt>
                <dd>{{ formatPaymentTypeLabel(currentPayment.paymentType) }}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{{ formatDateTime(currentPayment.createdAt) }}</dd>
              </div>
              <div v-if="currentPayment.verifiedAt">
                <dt>Verified</dt>
                <dd>{{ formatDateTime(currentPayment.verifiedAt) }}</dd>
              </div>
              <div v-if="currentPayment.gatewayStatus">
                <dt>Gateway status</dt>
                <dd>{{ currentPayment.gatewayStatus }}</dd>
              </div>
            </dl>

            <div v-if="currentPayment" class="current-payment-actions">
              <button
                v-if="!isLocalPaymentBypassEnabled && currentPayment.status === 'pending'"
                type="button"
                class="payment-button is-primary"
                :disabled="isCompletingPayment || !state.profile || !property"
                @click="handleOpenPaystackCheckout"
              >
                <IonSpinner v-if="isCompletingPayment" name="crescent" aria-hidden="true" />
                <span>{{ isCompletingPayment ? 'Opening checkout...' : 'Pay with Paystack' }}</span>
                <IonIcon
                  v-if="!isCompletingPayment"
                  :icon="arrowForwardOutline"
                  aria-hidden="true"
                />
              </button>
              <button
                v-if="isLocalPaymentBypassEnabled && currentPayment.status === 'pending'"
                type="button"
                class="payment-button is-success"
                :disabled="isCompletingPayment"
                @click="handleCompletePayment('success')"
              >
                <IonSpinner v-if="isCompletingPayment" name="crescent" aria-hidden="true" />
                {{ isCompletingPayment ? 'Updating...' : 'Simulate successful payment' }}
              </button>
              <button
                v-if="isLocalPaymentBypassEnabled && currentPayment.status === 'pending'"
                type="button"
                class="payment-button is-danger-outline"
                :disabled="isCompletingPayment"
                @click="handleCompletePayment('failed')"
              >
                Simulate failed payment
              </button>
              <button
                v-if="!isLocalPaymentBypassEnabled && currentPayment.status === 'pending'"
                type="button"
                class="payment-button is-secondary"
                :disabled="isCompletingPayment || !state.profile"
                @click="handleVerifyPendingPayment"
              >
                <IonIcon :icon="refreshOutline" aria-hidden="true" />
                {{ isCompletingPayment ? 'Verifying payment...' : 'Retry verification' }}
              </button>
              <RouterLink
                v-if="
                  property &&
                  currentPayment.paymentType === 'inspection_fee' &&
                  currentPayment.status === 'success'
                "
                :to="`/booking/${property.id}`"
                class="payment-button is-dark"
              >
                Continue to booking
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </RouterLink>
            </div>

            <div class="payment-status-note">
              <IonIcon :icon="informationCircleOutline" aria-hidden="true" />
              <span v-if="currentPayment">
                {{
                  currentPayment.status === 'success'
                    ? 'This payment has been verified successfully.'
                    : currentPayment.status === 'failed'
                      ? 'This attempt was not successful. Create a new reference when you are ready to try again.'
                      : 'Pending payments are marked successful only after backend verification.'
                }}
              </span>
              <span v-else
                >Once a payment is created, its verification status will appear here.</span
              >
            </div>
          </article>
        </section>

        <section class="payment-lower-grid" aria-label="Payment progress and history">
          <article class="payment-card payment-flow-card" aria-labelledby="payment-flow-title">
            <div class="payment-card__heading">
              <div>
                <p class="payment-eyebrow">Payment flow</p>
                <h2 id="payment-flow-title">Complete your payment</h2>
                <span>Follow these steps to complete and verify your payment.</span>
              </div>
            </div>

            <ol class="payment-flow">
              <li
                v-for="(step, index) in paymentFlowSteps"
                :key="step.title"
                :class="flowStepClass(index + 1)"
              >
                <span class="payment-flow__number">
                  <IonIcon
                    v-if="isFlowStepComplete(index + 1)"
                    :icon="checkmarkCircleOutline"
                    aria-hidden="true"
                  />
                  <template v-else>{{ index + 1 }}</template>
                </span>
                <span class="payment-flow__icon" aria-hidden="true"
                  ><IonIcon :icon="step.icon"
                /></span>
                <span class="payment-flow__copy">
                  <strong>{{ step.title }}</strong>
                  <small>{{ step.description }}</small>
                </span>
              </li>
            </ol>
          </article>

          <article
            class="payment-card payment-history-card"
            aria-labelledby="payment-history-title"
          >
            <div class="payment-card__heading payment-history-heading">
              <div>
                <p class="payment-eyebrow">Recent payments</p>
                <h2 id="payment-history-title">Payment history</h2>
              </div>
              <button
                type="button"
                class="payment-refresh"
                :disabled="isHistoryLoading"
                aria-label="Refresh payment history"
                @click="loadPayments"
              >
                <IonSpinner v-if="isHistoryLoading" name="crescent" aria-hidden="true" />
                <IonIcon v-else :icon="refreshOutline" aria-hidden="true" />
                <span>Refresh</span>
              </button>
            </div>

            <div
              v-if="isHistoryLoading && !recentPayments.length"
              class="payment-skeleton"
              aria-label="Loading payment history"
            >
              <span v-for="index in 4" :key="index" />
            </div>

            <div v-else-if="historyError" class="payment-history-error" role="alert">
              <IonIcon :icon="alertCircleOutline" aria-hidden="true" />
              <div>
                <strong>Payment history could not be loaded</strong><span>{{ historyError }}</span>
              </div>
              <button type="button" @click="loadPayments">Try again</button>
            </div>

            <template v-else-if="recentPayments.length">
              <div class="payment-table-wrap">
                <table class="payment-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Property</th>
                      <th>Payment type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th><span class="sr-only">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="payment in recentPayments" :key="payment.id">
                      <td :title="payment.paystackReference">
                        {{ compactReference(payment.paystackReference) }}
                      </td>
                      <td>{{ payment.propertyTitle }}</td>
                      <td>{{ formatPaymentTypeLabel(payment.paymentType) }}</td>
                      <td>{{ formatNaira(payment.amount) }}</td>
                      <td>
                        <span class="payment-status" :class="statusClassMap[payment.status]">
                          <IonIcon :icon="statusIconMap[payment.status]" aria-hidden="true" />
                          {{ formatPaymentStatusLabel(payment.status) }}
                        </span>
                      </td>
                      <td>{{ formatShortDate(payment.createdAt) }}</td>
                      <td>
                        <button
                          v-if="payment.status === 'pending'"
                          type="button"
                          class="payment-row-action"
                          :aria-label="`Resume payment for ${payment.propertyTitle}`"
                          @click="handleResumePayment(payment)"
                        >
                          Resume <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="payment-mobile-history">
                <article v-for="payment in recentPayments" :key="payment.id">
                  <div>
                    <strong>{{ payment.propertyTitle }}</strong>
                    <span>{{ formatPaymentTypeLabel(payment.paymentType) }}</span>
                  </div>
                  <span class="payment-status" :class="statusClassMap[payment.status]">
                    <IonIcon :icon="statusIconMap[payment.status]" aria-hidden="true" />
                    {{ formatPaymentStatusLabel(payment.status) }}
                  </span>
                  <dl>
                    <div>
                      <dt>Reference</dt>
                      <dd>{{ compactReference(payment.paystackReference) }}</dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>{{ formatNaira(payment.amount) }}</dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>{{ formatShortDate(payment.createdAt) }}</dd>
                    </div>
                  </dl>
                  <button
                    v-if="payment.status === 'pending'"
                    type="button"
                    class="payment-row-action"
                    @click="handleResumePayment(payment)"
                  >
                    Resume payment <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
                  </button>
                </article>
              </div>
            </template>

            <div v-else class="payment-history-empty">
              <span aria-hidden="true"><IonIcon :icon="documentTextOutline" /></span>
              <h3>No payments yet</h3>
              <p>Create your first payment reference to see it here.</p>
              <button type="button" class="payment-button is-secondary" @click="focusPaymentSetup">
                Create payment reference
              </button>
            </div>
          </article>
        </section>

        <footer class="payment-security-note">
          <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />
          <div>
            <strong>Secure payment verification</strong>
            <span
              >Card details are handled by Paystack. RANDSA waits for verification before marking
              live payments successful.</span
            >
          </div>
        </footer>
      </main>
    </div>

    <div class="payment-mobile-nav">
      <AppBottomNav />
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  addCircleOutline,
  alertCircleOutline,
  arrowForwardOutline,
  bookmarkOutline,
  businessOutline,
  calendarOutline,
  cardOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  closeCircleOutline,
  documentTextOutline,
  homeOutline,
  informationCircleOutline,
  lockClosedOutline,
  notificationsOutline,
  personOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import AppBottomNav from '../components/navigation/AppBottomNav.vue'
import { useAuth } from '../composables/useAuth'
import { useBookings } from '../composables/useBookings'
import { useNotifications } from '../composables/useNotifications'
import { usePayments } from '../composables/usePayments'
import { useProperties } from '../composables/useProperties'
import { isLocalPaymentBypassEnabled } from '../lib/payments'
import { openPaystackCheckout } from '../lib/paystack'
import {
  buildPaymentTypeOptions,
  formatNaira,
  formatPaymentStatusLabel,
  formatPaymentTypeLabel,
  getSuggestedPaymentAmount,
  type PaymentRecord,
  type PaymentStatus,
  type PaymentType,
} from '../types/payment'
import type { PropertyRecord } from '../types/property'

const route = useRoute()
const propertyId = computed(() => (route.params.propertyId as string | undefined) ?? '')
const bookingId = computed(() =>
  typeof route.query.bookingId === 'string' ? route.query.bookingId : ''
)
const { state, canManageProperties } = useAuth()
const { getBookingById } = useBookings()
const {
  properties,
  isLoading: arePropertiesLoading,
  error: propertyError,
  findById,
} = useProperties()
const { payments, isLoading, refreshForUser, startPayment, finishLocalPayment, verifyPayment } =
  usePayments()
const { addPaymentConfirmation } = useNotifications()

const property = ref<PropertyRecord | null>(null)
const selectedPropertyId = ref('')
const selectedBooking = ref<Awaited<ReturnType<typeof getBookingById>>>(null)
const selectedType = ref<PaymentType>('inspection_fee')
const amount = ref(0)
const activePayment = ref<PaymentRecord | null>(null)
const setupMessage = ref('')
const setupTone = ref<'success' | 'error'>('success')
const hasAttemptedCreate = ref(false)
const isHistoryLoading = ref(false)
const historyError = ref('')

const paymentTypeValues: PaymentType[] = [
  'inspection_fee',
  'rent_deposit',
  'full_rent_payment',
  'service_fee',
  'booking_payment',
]

const howItWorks = [
  'Choose a property',
  'Enter the payment amount',
  'Generate a reference',
  'Complete Paystack checkout',
  'Verification updates automatically',
]

const paymentFlowSteps = [
  {
    title: 'Choose a property',
    description: 'Select the listing you want to make payment for.',
    icon: businessOutline,
  },
  {
    title: 'Enter amount',
    description: 'Confirm the payment type and generate a reference.',
    icon: cardOutline,
  },
  {
    title: 'Pay with Paystack',
    description: 'Proceed to Paystack checkout to complete the payment.',
    icon: walletOutline,
  },
  {
    title: 'Verify and confirm',
    description: 'Your payment is verified before your account is updated.',
    icon: shieldCheckmarkOutline,
  },
]

const paymentNavigationItems = computed(() => [
  { label: 'Home', to: '/home', icon: homeOutline, matchers: ['/home'] },
  ...(canManageProperties.value
    ? [
        {
          label: 'Add property',
          to: '/add-property',
          icon: addCircleOutline,
          matchers: ['/add-property', '/edit-property'],
        },
      ]
    : []),
  {
    label: 'Bookings',
    to: '/my-bookings',
    icon: calendarOutline,
    matchers: ['/my-bookings', '/booking'],
  },
  { label: 'Payments', to: '/payment', icon: cardOutline, matchers: ['/payment'] },
  {
    label: 'Saved properties',
    to: '/saved-properties',
    icon: bookmarkOutline,
    matchers: ['/saved-properties'],
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: notificationsOutline,
    matchers: ['/notifications'],
  },
  { label: 'Account Center', to: '/profile', icon: personOutline, matchers: ['/profile'] },
])

const propertyChoices = computed(() => {
  const approved = properties.value.filter((item) => item.status === 'approved' && item.isAvailable)
  if (property.value && !approved.some((item) => item.id === property.value?.id)) {
    return [property.value, ...approved]
  }
  return approved
})
const paymentOptions = computed(() =>
  property.value ? buildPaymentTypeOptions(property.value, selectedBooking.value) : []
)
const selectedPropertyImage = computed(() => property.value?.images[0] ?? '')
const propertyLocation = computed(() => {
  if (!property.value) return ''
  return [property.value.area, property.value.city, property.value.state].filter(Boolean).join(', ')
})
const recentPayments = computed(() => payments.value.slice(0, 8))
const currentPayment = computed(() => activePayment.value)
const isStartingPayment = computed(() => isLoading.value && !activePayment.value)
const isCompletingPayment = computed(() => isLoading.value && Boolean(activePayment.value))
const amountError = computed(() => {
  if (!hasAttemptedCreate.value && amount.value >= 0) return ''
  if (!Number.isFinite(amount.value) || amount.value <= 0)
    return 'Enter an amount greater than zero.'
  return ''
})
const formattedAmountInput = computed({
  get: () =>
    amount.value > 0
      ? new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(amount.value)
      : '',
  set: (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '')
    const [whole = '', ...fractionParts] = cleaned.split('.')
    const normalized = fractionParts.length
      ? `${whole}.${fractionParts.join('').slice(0, 2)}`
      : whole
    amount.value = normalized ? Number(normalized) : 0
  },
})
const profileInitial = computed(() =>
  (state.profile?.fullName || state.profile?.email || 'R').trim().charAt(0).toUpperCase()
)
const profileRoleLabel = computed(() => {
  const role = state.profile?.role
  return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : 'Signed-in account'
})
const paymentFlowStage = computed(() => {
  if (!property.value) return 1
  if (!activePayment.value) return 2
  if (activePayment.value.status === 'pending') return 3
  return 4
})

const statusClassMap: Record<PaymentStatus, string> = {
  success: 'is-success',
  pending: 'is-pending',
  failed: 'is-failed',
}
const statusIconMap: Record<PaymentStatus, string> = {
  success: checkmarkCircleOutline,
  pending: timeOutline,
  failed: closeCircleOutline,
}

watch(
  [propertyId, bookingId, () => state.profile?.uid],
  async ([value, currentBookingId, userId]) => {
    const nextProperty = value ? await findById(value) : null
    property.value = nextProperty
    selectedPropertyId.value = nextProperty?.id ?? ''
    selectedBooking.value =
      currentBookingId && userId ? await getBookingById(currentBookingId) : null

    if (selectedBooking.value && selectedBooking.value.propertyId !== value) {
      selectedBooking.value = null
      setupTone.value = 'error'
      setupMessage.value = 'The selected booking does not belong to this listing.'
    }

    resetSuggestedAmount()
    setLatestContextPayment()
  },
  { immediate: true }
)

watch(
  () => route.query.type,
  (queryValue) => {
    if (typeof queryValue === 'string' && paymentTypeValues.includes(queryValue as PaymentType)) {
      selectedType.value = queryValue as PaymentType
    }
  },
  { immediate: true }
)

watch(selectedType, () => {
  hasAttemptedCreate.value = false
  resetSuggestedAmount()
})

watch(
  () => state.profile?.uid,
  () => {
    void loadPayments()
  },
  { immediate: true }
)

watch(payments, (items) => {
  if (activePayment.value) {
    activePayment.value =
      items.find((item) => item.id === activePayment.value?.id) ?? activePayment.value
  } else {
    setLatestContextPayment()
  }
})

async function loadPayments() {
  isHistoryLoading.value = true
  historyError.value = ''
  try {
    await refreshForUser(state.profile?.uid)
  } catch (caughtError) {
    historyError.value =
      caughtError instanceof Error ? caughtError.message : 'Could not load payment history.'
  } finally {
    isHistoryLoading.value = false
  }
}

async function handlePropertySelection() {
  setupMessage.value = ''
  activePayment.value = null
  selectedBooking.value = null
  property.value = selectedPropertyId.value
    ? (properties.value.find((item) => item.id === selectedPropertyId.value) ??
      (await findById(selectedPropertyId.value)))
    : null

  if (selectedType.value === 'booking_payment') selectedType.value = 'inspection_fee'
  resetSuggestedAmount()
  setLatestContextPayment()
}

async function handleResumePayment(payment: PaymentRecord) {
  const nextProperty =
    properties.value.find((item) => item.id === payment.propertyId) ??
    (await findById(payment.propertyId))
  if (!nextProperty) {
    setupTone.value = 'error'
    setupMessage.value = 'The property linked to this payment is no longer available.'
    return
  }

  property.value = nextProperty
  selectedPropertyId.value = nextProperty.id
  selectedBooking.value = payment.bookingId ? await getBookingById(payment.bookingId) : null
  selectedType.value = payment.paymentType
  amount.value = payment.amount
  activePayment.value = payment
  setupMessage.value = ''
  document
    .getElementById('payment-page-title')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function setLatestContextPayment() {
  if (!property.value) {
    activePayment.value = null
    return
  }
  activePayment.value =
    payments.value.find(
      (payment) =>
        payment.propertyId === property.value?.id &&
        (!bookingId.value || payment.bookingId === bookingId.value)
    ) ?? null
}

async function handleCreatePayment() {
  hasAttemptedCreate.value = true
  if (!state.profile) {
    setupTone.value = 'error'
    setupMessage.value = 'Sign in before creating a payment reference.'
    return
  }
  if (!property.value) {
    setupTone.value = 'error'
    setupMessage.value = 'Select a property before creating a payment reference.'
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
      selectedType.value === 'booking_payment' ? (selectedBooking.value?.id ?? null) : null
    )
    activePayment.value = payment
    setupTone.value = 'success'
    setupMessage.value = isLocalPaymentBypassEnabled
      ? 'Pending payment created. You can now simulate Paystack success or failure locally.'
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
    activePayment.value = await finishLocalPayment(
      activePayment.value.id,
      state.profile.uid,
      status
    )
    let notificationNotice = ''
    try {
      await addPaymentConfirmation(state.profile, activePayment.value)
    } catch {
      notificationNotice =
        ' The payment changed successfully, but the notification could not be synced yet.'
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
      result.reference
    )
    let notificationNotice = ''
    try {
      await addPaymentConfirmation(state.profile, activePayment.value)
    } catch {
      notificationNotice =
        ' Payment verification succeeded, but the notification could not be synced yet.'
    }
    setupTone.value = 'success'
    setupMessage.value =
      activePayment.value.status === 'success'
        ? `Paystack payment verified successfully.${notificationNotice}`
        : `The payment was checked, but Paystack did not confirm success.${notificationNotice}`
  } catch (caughtError) {
    setupTone.value = 'error'
    setupMessage.value =
      caughtError instanceof Error
        ? caughtError.message
        : 'Could not complete the Paystack checkout flow.'
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
      activePayment.value.paystackReference
    )
    let notificationNotice = ''
    if (activePayment.value.status === 'success') {
      try {
        await addPaymentConfirmation(state.profile, activePayment.value)
      } catch {
        notificationNotice =
          ' The payment was verified, but the notification could not be synced yet.'
      }
    }
    setupTone.value = activePayment.value.status === 'success' ? 'success' : 'error'
    setupMessage.value =
      activePayment.value.status === 'success'
        ? `Pending payment verified successfully.${notificationNotice}`
        : 'Payment was submitted, but verification is still pending. Please wait or retry verification.'
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
  hasAttemptedCreate.value = false
}

function isPaymentNavActive(matchers: string[]) {
  return matchers.some((matcher) => route.path === matcher || route.path.startsWith(`${matcher}/`))
}

function isFlowStepComplete(step: number) {
  if (activePayment.value?.status === 'success') return true
  return step < paymentFlowStage.value
}

function flowStepClass(step: number) {
  return {
    'is-complete': isFlowStepComplete(step),
    'is-current': step === paymentFlowStage.value && activePayment.value?.status !== 'success',
    'is-error': step === 3 && activePayment.value?.status === 'failed',
  }
}

function focusPaymentSetup() {
  document.getElementById('payment-setup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function compactReference(value: string) {
  if (value.length <= 18) return value
  return `${value.slice(0, 10)}...${value.slice(-5)}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  )
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
</script>

<style scoped>
.payment-workspace {
  --payment-bg: #f5f7fb;
  --payment-surface: #ffffff;
  --payment-soft: #f6f8fc;
  --payment-text: #102033;
  --payment-muted: #66778d;
  --payment-subtle: #8794a6;
  --payment-border: #e0e7f0;
  --payment-blue: #1769ef;
  --payment-blue-dark: #0f56cc;
  --payment-blue-soft: #edf4ff;
  --payment-green: #078a50;
  --payment-green-soft: #ecfdf3;
  --payment-amber: #a85d00;
  --payment-amber-soft: #fff7e6;
  --payment-red: #ce294c;
  --payment-red-soft: #fff1f3;
  min-height: 100%;
  background: var(--payment-bg);
  color: var(--payment-text);
}

.payment-sidebar {
  display: none;
}

.payment-main {
  min-width: 0;
  padding: 12px 12px 118px;
}

.payment-header {
  display: flex;
  min-height: 144px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid var(--payment-border);
  border-radius: 18px;
  background: linear-gradient(110deg, var(--payment-surface) 52%, var(--payment-blue-soft));
  padding: 24px 28px;
  box-shadow: 0 18px 42px -38px rgba(16, 32, 51, 0.5);
}

.payment-breadcrumb,
.payment-eyebrow {
  margin: 0;
  color: var(--payment-subtle);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.payment-breadcrumb span,
.payment-eyebrow {
  color: var(--payment-blue);
}

.payment-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.payment-title-row h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0;
}

.payment-title-icon,
.payment-heading-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  background: var(--payment-blue-soft);
  color: var(--payment-blue);
}

.payment-title-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  font-size: 20px;
}

.payment-header > div > p:last-child {
  max-width: 720px;
  margin: 8px 0 0;
  color: var(--payment-muted);
  font-size: 13px;
  line-height: 1.6;
}

.paystack-security {
  display: inline-flex;
  min-height: 38px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  border: 1px solid #cdebdc;
  border-radius: 12px;
  background: var(--payment-green-soft);
  padding: 0 12px;
  color: #38604d;
  font-size: 11px;
}

.paystack-security ion-icon {
  color: var(--payment-green);
  font-size: 16px;
}

.payment-notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  border: 1px solid;
  border-radius: 12px;
  padding: 11px 13px;
  font-size: 12px;
  line-height: 1.5;
}

.payment-notice > ion-icon {
  font-size: 19px;
}
.payment-notice.is-success {
  border-color: #a8e1c5;
  background: var(--payment-green-soft);
  color: var(--payment-green);
}
.payment-notice.is-error {
  border-color: #f4bac7;
  background: var(--payment-red-soft);
  color: var(--payment-red);
}
.payment-notice button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: currentColor;
  font-size: 18px;
}

.payment-dashboard,
.payment-lower-grid {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.payment-card {
  min-width: 0;
  border: 1px solid var(--payment-border);
  border-radius: 18px;
  background: var(--payment-surface);
  padding: 22px;
  box-shadow: 0 20px 48px -42px rgba(16, 32, 51, 0.6);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    transform 200ms ease;
}

.payment-card:hover {
  border-color: #ced9e7;
  box-shadow: 0 24px 52px -40px rgba(16, 32, 51, 0.68);
  transform: translateY(-2px);
}

.payment-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.payment-card__heading h2 {
  margin: 8px 0 0;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 0;
}

.payment-card__heading > div > span {
  display: block;
  max-width: 560px;
  margin-top: 7px;
  color: var(--payment-muted);
  font-size: 12px;
  line-height: 1.55;
}

.payment-heading-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  font-size: 21px;
}

.payment-setup-layout {
  display: grid;
  gap: 20px;
  margin-top: 22px;
}

.payment-form {
  display: grid;
  min-width: 0;
  gap: 14px;
}

.payment-field > span:first-child {
  display: block;
  margin-bottom: 8px;
  color: #344256;
  font-size: 12px;
  font-weight: 800;
}

.payment-select-wrap,
.payment-amount-wrap {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  gap: 9px;
  border: 1px solid #d9e2ed;
  border-radius: 12px;
  background: var(--payment-surface);
  padding: 0 13px;
  transition:
    border-color 190ms ease,
    box-shadow 190ms ease;
}

.payment-select-wrap:focus-within,
.payment-amount-wrap:focus-within {
  border-color: #70a9f8;
  box-shadow: 0 0 0 4px rgba(23, 105, 239, 0.1);
}

.payment-select-wrap > ion-icon,
.payment-amount-wrap > span {
  flex: 0 0 auto;
  color: var(--payment-blue);
  font-size: 17px;
  font-weight: 800;
}

.payment-select-wrap select,
.payment-amount-wrap input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--payment-text);
  font-size: 13px;
}

.payment-select-wrap select {
  min-height: 46px;
  cursor: pointer;
}

.payment-select-wrap ion-spinner {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  color: var(--payment-blue);
}

.payment-amount-wrap.has-error {
  border-color: #ec8da1;
}

.selected-property {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  border-left: 3px solid var(--payment-blue);
  background: var(--payment-soft);
  padding: 10px 12px;
}

.selected-property__media {
  display: grid;
  width: 64px;
  aspect-ratio: 4 / 3;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: var(--payment-blue-soft);
  color: var(--payment-blue);
}

.selected-property__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.selected-property strong,
.selected-property span,
.selected-property small {
  display: block;
}
.selected-property strong {
  font-size: 12px;
}
.selected-property span {
  overflow: hidden;
  margin-top: 3px;
  color: var(--payment-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.selected-property small {
  margin-top: 4px;
  color: var(--payment-blue);
  font-size: 9px;
  font-weight: 750;
}

.payment-field-hint,
.payment-field-error {
  margin: -7px 0 0;
  font-size: 10px;
  line-height: 1.5;
}

.payment-field-hint {
  color: var(--payment-subtle);
}
.payment-field-error {
  color: var(--payment-red);
}

.payment-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.payment-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 11px;
  padding: 0 15px;
  font-size: 11px;
  font-weight: 850;
  text-align: center;
  text-decoration: none;
  transition:
    transform 190ms ease,
    background-color 190ms ease,
    border-color 190ms ease,
    box-shadow 190ms ease;
}

.payment-button:hover:not(:disabled) {
  transform: translateY(-2px);
}
.payment-button ion-spinner {
  width: 17px;
  height: 17px;
}
.payment-button ion-icon {
  font-size: 16px;
  transition: transform 190ms ease;
}
.payment-button:hover:not(:disabled) ion-icon:last-child {
  transform: translateX(2px);
}
.payment-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.payment-button.is-primary {
  background: var(--payment-blue);
  color: #fff;
  box-shadow: 0 12px 22px -15px rgba(23, 105, 239, 0.8);
}
.payment-button.is-primary:hover:not(:disabled) {
  background: var(--payment-blue-dark);
}
.payment-button.is-secondary {
  border-color: #cfd9e6;
  background: var(--payment-surface);
  color: #344256;
}
.payment-button.is-secondary:hover:not(:disabled) {
  border-color: #91baf3;
  color: var(--payment-blue);
}
.payment-button.is-success {
  background: var(--payment-green);
  color: #fff;
}
.payment-button.is-danger-outline {
  border-color: #efb0be;
  background: var(--payment-surface);
  color: var(--payment-red);
}
.payment-button.is-dark {
  background: var(--payment-text);
  color: #fff;
}

.payment-how {
  border-top: 1px solid var(--payment-border);
  padding-top: 18px;
}

.payment-how > div {
  display: flex;
  align-items: center;
  gap: 7px;
}

.payment-how > div ion-icon {
  color: var(--payment-blue);
  font-size: 18px;
}
.payment-how h3 {
  margin: 0;
  font-size: 12px;
  font-weight: 850;
}
.payment-how ol {
  display: grid;
  gap: 8px;
  margin: 13px 0 0;
  padding: 0;
  list-style: none;
}
.payment-how li {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.payment-how li > span {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 50%;
  background: var(--payment-blue-soft);
  color: var(--payment-blue);
  font-size: 8px;
  font-weight: 900;
}
.payment-how li p {
  margin: 0;
  color: var(--payment-muted);
  font-size: 10px;
  line-height: 1.4;
}

.payment-status {
  display: inline-flex;
  width: fit-content;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  border-radius: 10px;
  padding: 5px 8px;
  font-size: 9px;
  font-weight: 850;
  text-transform: capitalize;
}

.payment-status.is-success {
  background: var(--payment-green-soft);
  color: var(--payment-green);
}
.payment-status.is-pending {
  background: var(--payment-amber-soft);
  color: var(--payment-amber);
}
.payment-status.is-failed {
  background: var(--payment-red-soft);
  color: var(--payment-red);
}

.payment-empty-visual {
  position: relative;
  width: 100px;
  height: 86px;
  margin: 24px auto 12px;
}

.payment-empty-visual > span {
  display: grid;
  width: 78px;
  height: 68px;
  place-items: center;
  border-radius: 18px;
  background: var(--payment-blue-soft);
  color: #6b94f8;
  transform: rotate(-4deg);
}

.payment-empty-visual > span ion-icon {
  font-size: 43px;
}
.payment-empty-visual > i {
  position: absolute;
  right: 0;
  bottom: 0;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 4px solid var(--payment-surface);
  border-radius: 50%;
  background: var(--payment-blue);
  color: #fff;
  font-size: 20px;
}

.payment-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 20px 0 0;
  border-block: 1px solid var(--payment-border);
}

.payment-summary > div {
  min-width: 0;
  border-right: 1px solid var(--payment-border);
  padding: 13px 10px;
}

.payment-summary > div:first-child {
  padding-left: 0;
}
.payment-summary > div:last-child {
  border-right: 0;
  padding-right: 0;
}
.payment-summary dt {
  color: var(--payment-subtle);
  font-size: 8px;
  font-weight: 800;
}
.payment-summary dd {
  overflow: hidden;
  margin: 5px 0 0;
  color: var(--payment-text);
  font-size: 10px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-payment-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 18px;
  margin: 17px 0 0;
}

.current-payment-details > div {
  display: flex;
  min-width: 0;
  justify-content: space-between;
  gap: 10px;
}
.current-payment-details dt {
  color: var(--payment-subtle);
  font-size: 9px;
}
.current-payment-details dd {
  overflow: hidden;
  margin: 0;
  color: var(--payment-text);
  font-size: 9px;
  font-weight: 800;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-payment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 19px;
}

.payment-status-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 18px;
  background: var(--payment-blue-soft);
  padding: 11px 12px;
  color: #315b91;
  font-size: 10px;
  line-height: 1.5;
}

.payment-status-note ion-icon {
  flex: 0 0 auto;
  color: var(--payment-blue);
  font-size: 17px;
}

.payment-flow {
  display: grid;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.payment-flow li {
  position: relative;
  display: grid;
  grid-template-columns: 26px 38px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding-bottom: 18px;
}

.payment-flow li:not(:last-child)::after {
  position: absolute;
  top: 27px;
  bottom: 0;
  left: 12px;
  width: 2px;
  background: var(--payment-border);
  content: '';
}

.payment-flow__number {
  position: relative;
  z-index: 1;
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 1px solid var(--payment-border);
  border-radius: 50%;
  background: var(--payment-surface);
  color: var(--payment-subtle);
  font-size: 9px;
  font-weight: 900;
}

.payment-flow__icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  background: var(--payment-soft);
  color: var(--payment-subtle);
  font-size: 18px;
}

.payment-flow__copy strong,
.payment-flow__copy small {
  display: block;
}
.payment-flow__copy strong {
  font-size: 11px;
}
.payment-flow__copy small {
  margin-top: 3px;
  color: var(--payment-muted);
  font-size: 9px;
  line-height: 1.5;
}
.payment-flow li.is-complete .payment-flow__number {
  border-color: #a9dfc5;
  background: var(--payment-green-soft);
  color: var(--payment-green);
  font-size: 16px;
}
.payment-flow li.is-complete:not(:last-child)::after {
  background: #a9dfc5;
}
.payment-flow li.is-complete .payment-flow__icon {
  background: var(--payment-green-soft);
  color: var(--payment-green);
}
.payment-flow li.is-current .payment-flow__number {
  border-color: #86b4f6;
  background: var(--payment-blue);
  color: #fff;
}
.payment-flow li.is-current .payment-flow__icon {
  background: var(--payment-blue-soft);
  color: var(--payment-blue);
}
.payment-flow li.is-error .payment-flow__number {
  border-color: #ec9daf;
  background: var(--payment-red);
  color: #fff;
}
.payment-flow li.is-error .payment-flow__icon {
  background: var(--payment-red-soft);
  color: var(--payment-red);
}

.payment-history-heading {
  align-items: center;
}
.payment-refresh,
.payment-row-action {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid var(--payment-border);
  border-radius: 9px;
  background: var(--payment-surface);
  padding: 0 10px;
  color: var(--payment-blue);
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

.payment-refresh ion-spinner {
  width: 14px;
  height: 14px;
}
.payment-refresh:disabled {
  opacity: 0.55;
}

.payment-table-wrap {
  width: 100%;
  overflow-x: auto;
  margin-top: 17px;
}

.payment-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9px;
  text-align: left;
}

.payment-table th {
  border-block: 1px solid var(--payment-border);
  background: var(--payment-soft);
  padding: 10px 8px;
  color: var(--payment-muted);
  font-weight: 850;
  white-space: nowrap;
}

.payment-table td {
  max-width: 150px;
  overflow: hidden;
  border-bottom: 1px solid var(--payment-border);
  padding: 11px 8px;
  color: var(--payment-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.payment-table td:nth-child(2),
.payment-table td:nth-child(4) {
  color: var(--payment-text);
  font-weight: 800;
}

.payment-mobile-history {
  display: none;
}

.payment-skeleton {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.payment-skeleton span {
  height: 46px;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef2f7 20%, #f8fafc 50%, #eef2f7 80%);
  background-size: 220% 100%;
  animation: payment-shimmer 1.4s ease-in-out infinite;
}

.payment-history-error {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  background: var(--payment-red-soft);
  padding: 13px;
  color: var(--payment-red);
}

.payment-history-error > ion-icon {
  font-size: 20px;
}
.payment-history-error strong,
.payment-history-error span {
  display: block;
}
.payment-history-error strong {
  font-size: 10px;
}
.payment-history-error span {
  margin-top: 3px;
  font-size: 9px;
  line-height: 1.4;
}
.payment-history-error button {
  min-height: 34px;
  border: 1px solid #efb0be;
  border-radius: 9px;
  padding: 0 10px;
  font-size: 9px;
  font-weight: 800;
}

.payment-history-empty {
  display: grid;
  min-height: 260px;
  place-items: center;
  align-content: center;
  padding: 22px;
  text-align: center;
}

.payment-history-empty > span {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 18px;
  background: var(--payment-blue-soft);
  color: #6c95f7;
  font-size: 30px;
}

.payment-history-empty h3 {
  margin: 13px 0 0;
  font-size: 13px;
}
.payment-history-empty p {
  margin: 5px 0 14px;
  color: var(--payment-muted);
  font-size: 10px;
}

.payment-security-note {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  border: 1px solid #cce7d9;
  border-radius: 14px;
  background: var(--payment-green-soft);
  padding: 13px 16px;
  color: #315d47;
}

.payment-security-note > ion-icon {
  flex: 0 0 auto;
  color: var(--payment-green);
  font-size: 24px;
}
.payment-security-note strong,
.payment-security-note span {
  display: block;
}
.payment-security-note strong {
  font-size: 10px;
}
.payment-security-note span {
  margin-top: 3px;
  font-size: 9px;
  line-height: 1.45;
}

.payment-mobile-nav {
  display: block;
}

.payment-button:focus-visible,
.payment-nav__link:focus-visible,
.payment-account-card:focus-visible,
.payment-row-action:focus-visible,
.payment-refresh:focus-visible,
.payment-notice button:focus-visible {
  outline: 3px solid rgba(23, 105, 239, 0.3);
  outline-offset: 2px;
}

@keyframes payment-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

@media (min-width: 1024px) {
  .payment-workspace {
    display: grid;
    grid-template-columns: 212px minmax(0, 1fr);
  }

  .payment-sidebar {
    position: sticky;
    top: 0;
    display: flex;
    height: 100vh;
    flex-direction: column;
    border-right: 1px solid var(--payment-border);
    background: var(--payment-surface);
    padding: 22px 14px;
  }

  .payment-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px 18px;
    color: var(--payment-text);
    text-decoration: none;
  }

  .payment-brand > span {
    color: var(--payment-blue);
    font-size: 37px;
    font-weight: 950;
    line-height: 1;
  }

  .payment-brand strong {
    font-size: 18px;
    font-weight: 900;
  }

  .payment-nav {
    display: grid;
    gap: 4px;
    border-top: 1px solid var(--payment-border);
    padding-top: 14px;
  }

  .payment-nav__link {
    display: flex;
    min-height: 44px;
    align-items: center;
    gap: 11px;
    border-radius: 10px;
    padding: 0 12px;
    color: #40516a;
    font-size: 11px;
    font-weight: 750;
    text-decoration: none;
    transition:
      background-color 190ms ease,
      color 190ms ease,
      transform 190ms ease;
  }

  .payment-nav__link ion-icon {
    font-size: 18px;
  }
  .payment-nav__link:hover {
    background: var(--payment-soft);
    color: var(--payment-blue);
    transform: translateX(2px);
  }
  .payment-nav__link.is-active {
    background: var(--payment-blue);
    color: #fff;
    box-shadow: 0 12px 22px -16px rgba(23, 105, 239, 0.85);
  }

  .payment-account-card {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    margin-top: auto;
    border: 1px solid var(--payment-border);
    border-radius: 12px;
    padding: 10px;
    color: var(--payment-text);
    text-decoration: none;
  }

  .payment-account-card > img,
  .payment-account-card__avatar {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    object-fit: cover;
    border-radius: 10px;
    background: var(--payment-blue-soft);
    color: var(--payment-blue);
    font-size: 13px;
    font-weight: 900;
  }

  .payment-account-card__copy {
    min-width: 0;
  }
  .payment-account-card__copy strong,
  .payment-account-card__copy small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .payment-account-card__copy strong {
    font-size: 10px;
  }
  .payment-account-card__copy small {
    margin-top: 3px;
    color: var(--payment-muted);
    font-size: 8px;
  }
  .payment-account-card > ion-icon {
    color: var(--payment-muted);
  }

  .payment-main {
    padding: 16px 18px 28px;
  }
  .payment-mobile-nav {
    display: none;
  }
}

@media (min-width: 1200px) {
  .payment-dashboard {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  }
  .payment-lower-grid {
    grid-template-columns: minmax(300px, 0.78fr) minmax(0, 1.42fr);
  }
}

@media (min-width: 1420px) {
  .payment-workspace {
    grid-template-columns: 224px minmax(0, 1fr);
  }
  .payment-main {
    padding: 18px 24px 32px;
  }
  .payment-setup-layout {
    grid-template-columns: minmax(0, 1fr) 175px;
  }
  .payment-how {
    border-top: 0;
    border-left: 1px solid var(--payment-border);
    padding-top: 0;
    padding-left: 18px;
  }
}

@media (max-width: 767px) {
  .payment-main {
    padding-inline: 10px;
  }
  .payment-header {
    min-height: 0;
    align-items: flex-start;
    border-radius: 16px;
    padding: 19px 17px;
  }
  .payment-title-row h1 {
    font-size: 26px;
  }
  .payment-title-icon {
    width: 31px;
    height: 31px;
  }
  .payment-header > div > p:last-child {
    font-size: 11px;
  }
  .paystack-security {
    min-height: 34px;
    padding: 0 9px;
    font-size: 9px;
  }
  .payment-card {
    border-radius: 16px;
    padding: 18px 15px;
  }
  .payment-card:hover {
    transform: none;
  }
  .payment-card__heading h2 {
    font-size: 17px;
  }
  .payment-card__heading > div > span {
    font-size: 11px;
  }
  .payment-heading-icon {
    display: none;
  }
  .payment-form__actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
  .payment-button {
    width: 100%;
    min-height: 46px;
  }
  .payment-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .payment-summary > div {
    border-bottom: 1px solid var(--payment-border);
  }
  .payment-summary > div:nth-child(2) {
    border-right: 0;
  }
  .payment-summary > div:nth-child(3),
  .payment-summary > div:nth-child(4) {
    border-bottom: 0;
  }
  .payment-summary > div:nth-child(3) {
    padding-left: 0;
  }
  .current-payment-details {
    grid-template-columns: 1fr;
  }
  .current-payment-actions {
    flex-direction: column;
  }
  .payment-table-wrap {
    display: none;
  }
  .payment-mobile-history {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }
  .payment-mobile-history > article {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    border-top: 1px solid var(--payment-border);
    padding-top: 13px;
  }
  .payment-mobile-history > article:first-child {
    border-top: 0;
    padding-top: 0;
  }
  .payment-mobile-history > article > div:first-child strong,
  .payment-mobile-history > article > div:first-child span {
    display: block;
  }
  .payment-mobile-history > article > div:first-child strong {
    font-size: 11px;
  }
  .payment-mobile-history > article > div:first-child span {
    margin-top: 3px;
    color: var(--payment-muted);
    font-size: 9px;
  }
  .payment-mobile-history dl {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
    background: var(--payment-soft);
    padding: 10px;
  }
  .payment-mobile-history dl > div {
    min-width: 0;
    border-right: 1px solid var(--payment-border);
    padding: 0 8px;
  }
  .payment-mobile-history dl > div:first-child {
    padding-left: 0;
  }
  .payment-mobile-history dl > div:last-child {
    border-right: 0;
    padding-right: 0;
  }
  .payment-mobile-history dt {
    color: var(--payment-subtle);
    font-size: 7px;
  }
  .payment-mobile-history dd {
    overflow: hidden;
    margin: 4px 0 0;
    font-size: 8px;
    font-weight: 800;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .payment-mobile-history .payment-row-action {
    grid-column: 1 / -1;
    width: 100%;
    min-height: 38px;
  }
  .payment-security-note {
    align-items: flex-start;
  }
}

@media (max-width: 520px) {
  .payment-header {
    display: grid;
  }
  .paystack-security {
    justify-self: start;
  }
  .selected-property {
    grid-template-columns: 55px minmax(0, 1fr);
  }
  .selected-property__media {
    width: 55px;
  }
  .payment-history-error {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .payment-history-error button {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .payment-card,
  .payment-button,
  .payment-button ion-icon,
  .payment-nav__link,
  .payment-skeleton span {
    animation: none !important;
    scroll-behavior: auto !important;
    transition: none !important;
  }
}

:global(.dark) .payment-workspace {
  --payment-bg: #08111f;
  --payment-surface: #101b2b;
  --payment-soft: #152236;
  --payment-text: #f5f8fc;
  --payment-muted: #b0bdcd;
  --payment-subtle: #8797aa;
  --payment-border: #27364a;
  --payment-blue: #6aa6ff;
  --payment-blue-dark: #4d8fea;
  --payment-blue-soft: #142b4e;
  --payment-green: #4bd391;
  --payment-green-soft: #123326;
  --payment-amber: #f4bd54;
  --payment-amber-soft: #382b14;
  --payment-red: #ff7f98;
  --payment-red-soft: #3b1721;
}

:global(.dark) .payment-header {
  background: linear-gradient(110deg, var(--payment-surface) 52%, #11294a);
}
:global(.dark) .payment-field > span:first-child {
  color: #dbe5f1;
}
:global(.dark) .payment-select-wrap select,
:global(.dark) .payment-amount-wrap input {
  color-scheme: dark;
}
:global(.dark) .payment-skeleton span {
  background: #1a2a3f;
}
</style>
