<template>
  <AppShell
    :show-header="false"
    content-class="min-h-full w-full pb-28 lg:pb-0"
  >
    <div class="bookings-page">
      <NotificationSidebarNav
        :can-manage-properties="canManageProperties"
        :show-mobile="false"
        aria-label="Bookings page navigation"
      />

      <main class="bookings-main">
        <section class="bookings-hero" aria-labelledby="bookings-title">
          <div class="bookings-hero-copy">
            <p class="bookings-eyebrow">RANDSA <span aria-hidden="true">&#8226;</span> My bookings</p>
            <h1 id="bookings-title">Track your bookings</h1>
            <p>Review reservations, payment status, reminders, and cancellation controls in one place.</p>
          </div>

          <div class="bookings-hero-art" aria-hidden="true">
            <span class="hero-bell"><IonIcon :icon="notificationsOutline" /></span>
            <div class="hero-calendar">
              <span class="hero-calendar-rings"><i /><i /><i /></span>
              <strong>{{ String(bookingMetrics[0].value) }}</strong>
              <small>BOOKINGS</small>
              <IonIcon :icon="checkmarkCircle" />
            </div>
          </div>
        </section>

        <div
          v-if="message"
          class="booking-notice"
          :class="messageTone === 'success' ? 'booking-notice--success' : 'booking-notice--error'"
          role="status"
          aria-live="polite"
        >
          <IonIcon :icon="messageTone === 'success' ? checkmarkCircleOutline : alertCircleOutline" aria-hidden="true" />
          <span>{{ message }}</span>
        </div>

        <section class="booking-metrics" aria-label="Booking overview">
          <article
            v-for="metric in bookingMetrics"
            :key="metric.label"
            class="booking-metric"
          >
            <span class="metric-icon" :class="`metric-icon--${metric.tone}`">
              <IonIcon :icon="metric.icon" aria-hidden="true" />
            </span>
            <div>
              <p>{{ metric.label }}</p>
              <strong>{{ metric.value }}</strong>
              <small>{{ metric.copy }}</small>
            </div>
          </article>
        </section>

        <section class="booking-management" aria-labelledby="booking-list-title">
          <div class="booking-toolbar">
            <div class="booking-tabs" role="tablist" aria-label="Booking status">
              <button
                v-for="tab in bookingTabs"
                :key="tab.value"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab.value"
                :class="{ 'booking-tab--active': activeTab === tab.value }"
                @click="activeTab = tab.value"
              >
                {{ tab.label }}
                <span>{{ tab.count }}</span>
              </button>
            </div>

            <div class="booking-filter-bar">
              <label class="booking-search">
                <span class="sr-only">Search bookings</span>
                <IonIcon :icon="searchOutline" aria-hidden="true" />
                <input
                  v-model.trim="searchQuery"
                  type="search"
                  placeholder="Search bookings"
                  autocomplete="off"
                >
                <button
                  v-if="searchQuery"
                  type="button"
                  aria-label="Clear booking search"
                  @click="searchQuery = ''"
                >
                  <IonIcon :icon="closeOutline" aria-hidden="true" />
                </button>
              </label>

              <details class="booking-filter-menu">
                <summary>
                  <IonIcon :icon="calendarOutline" aria-hidden="true" />
                  <span>Date range</span>
                  <i v-if="fromDate || toDate" aria-hidden="true" />
                  <IonIcon :icon="chevronDownOutline" aria-hidden="true" />
                </summary>
                <div class="booking-filter-popover booking-date-popover">
                  <label>
                    <span>From</span>
                    <input v-model="fromDate" type="date">
                  </label>
                  <label>
                    <span>To</span>
                    <input v-model="toDate" type="date" :min="fromDate || undefined">
                  </label>
                  <button type="button" :disabled="!fromDate && !toDate" @click="clearDateRange">
                    Clear dates
                  </button>
                </div>
              </details>

              <details class="booking-filter-menu">
                <summary>
                  <IonIcon :icon="funnelOutline" aria-hidden="true" />
                  <span>Filter</span>
                  <i v-if="hasDetailFilters" aria-hidden="true" />
                  <IonIcon :icon="chevronDownOutline" aria-hidden="true" />
                </summary>
                <div class="booking-filter-popover">
                  <label>
                    <span>Booking status</span>
                    <select v-model="statusFilter">
                      <option value="all">Any status</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label>
                    <span>Payment status</span>
                    <select v-model="paymentFilter">
                      <option value="all">Any payment status</option>
                      <option value="pending">Pending</option>
                      <option value="success">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </label>
                  <label>
                    <span>Property</span>
                    <select v-model="propertyFilter">
                      <option value="all">All properties</option>
                      <option v-for="property in propertyOptions" :key="property.id" :value="property.id">
                        {{ property.label }}
                      </option>
                    </select>
                  </label>
                  <button type="button" :disabled="!hasDetailFilters" @click="clearDetailFilters">
                    Clear filters
                  </button>
                </div>
              </details>

              <label class="booking-sort">
                <span class="sr-only">Sort bookings</span>
                <IonIcon :icon="swapVerticalOutline" aria-hidden="true" />
                <select v-model="sortOrder">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </label>
            </div>
          </div>

          <div v-if="loadError" class="booking-state booking-state--error" role="alert">
            <span><IonIcon :icon="cloudOfflineOutline" aria-hidden="true" /></span>
            <h2>Bookings could not load</h2>
            <p>{{ loadError }}</p>
            <button type="button" @click="retryLoad">
              <IonIcon :icon="refreshOutline" aria-hidden="true" />
              Retry
            </button>
          </div>

          <div v-else-if="isInitialLoading" class="booking-workspace" aria-label="Loading bookings">
            <div class="booking-list-pane booking-skeleton-list">
              <div v-for="index in 4" :key="index" class="booking-row-skeleton">
                <span />
                <div><i /><i /><i /></div>
              </div>
            </div>
            <div class="booking-detail-pane booking-detail-skeleton">
              <span />
              <i /><i /><i /><i />
            </div>
          </div>

          <div v-else-if="bookingCards.length && filteredBookingCards.length" class="booking-workspace">
            <div class="booking-list-pane">
              <div class="booking-list-heading">
                <div>
                  <h2 id="booking-list-title">Bookings</h2>
                  <p>{{ filteredBookingCards.length }} of {{ bookingCards.length }} shown</p>
                </div>
                <button
                  v-if="hasActiveFilters"
                  type="button"
                  @click="clearAllFilters"
                >
                  Reset filters
                </button>
              </div>

              <div class="booking-list" role="list" aria-label="Your bookings">
                <button
                  v-for="item in filteredBookingCards"
                  :key="item.booking.id"
                  type="button"
                  role="listitem"
                  class="booking-list-row"
                  :class="{ 'booking-list-row--selected': selectedBookingId === item.booking.id }"
                  :aria-current="selectedBookingId === item.booking.id ? 'true' : undefined"
                  @click="selectedBookingId = item.booking.id"
                >
                  <span class="booking-row-image">
                    <img
                      v-if="item.propertyImage"
                      :src="item.propertyImage"
                      :alt="`${item.propertyTitle} listing`"
                      loading="lazy"
                      decoding="async"
                    >
                    <IonIcon v-else :icon="businessOutline" aria-label="Property image unavailable" />
                  </span>

                  <span class="booking-date-block" aria-label="Booking start date">
                    <small>{{ getDateParts(item.booking.startAt).month }}</small>
                    <strong>{{ getDateParts(item.booking.startAt).day }}</strong>
                    <span>{{ getDateParts(item.booking.startAt).year }}</span>
                  </span>

                  <span class="booking-row-copy">
                    <strong>{{ item.propertyTitle }}</strong>
                    <small>{{ item.location }}</small>
                    <span>
                      <IonIcon :icon="timeOutline" aria-hidden="true" />
                      {{ formatScheduleCompact(item.booking.startAt) }}
                    </span>
                    <i
                      class="booking-status"
                      :class="bookingStatusClassMap[item.booking.status]"
                    >
                      {{ titleCase(formatBookingStatusLabel(item.booking.status)) }}
                    </i>
                  </span>

                  <span class="booking-row-end">
                    <strong v-if="item.booking.estimatedTotal !== null">
                      {{ formatNaira(item.booking.estimatedTotal) }}
                    </strong>
                    <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
                  </span>
                </button>
              </div>
            </div>

            <aside v-if="selectedCard" class="booking-detail-pane" aria-label="Selected booking details">
              <div class="booking-detail-heading">
                <div>
                  <span class="booking-detail-icon"><IonIcon :icon="calendarClearOutline" aria-hidden="true" /></span>
                  <div>
                    <p>{{ selectedCard.config.summaryLabel }}</p>
                    <h2>Booking summary</h2>
                  </div>
                </div>
                <span
                  class="booking-status"
                  :class="bookingStatusClassMap[selectedCard.booking.status]"
                >
                  {{ titleCase(formatBookingStatusLabel(selectedCard.booking.status)) }}
                </span>
              </div>

              <div class="booking-property-summary">
                <div>
                  <h3>{{ selectedCard.propertyTitle }}</h3>
                  <p>
                    <IonIcon :icon="locationOutline" aria-hidden="true" />
                    {{ selectedCard.address }}
                  </p>
                </div>
                <figure>
                  <img
                    v-if="selectedCard.propertyImage"
                    :src="selectedCard.propertyImage"
                    :alt="`${selectedCard.propertyTitle} listing`"
                    loading="lazy"
                    decoding="async"
                  >
                  <span v-else><IonIcon :icon="businessOutline" aria-hidden="true" /></span>
                </figure>
              </div>

              <dl class="booking-detail-grid">
                <div>
                  <dt><IonIcon :icon="calendarOutline" aria-hidden="true" />Booking created</dt>
                  <dd>{{ formatDate(selectedCard.booking.createdAt) }}</dd>
                </div>
                <div>
                  <dt><IonIcon :icon="timeOutline" aria-hidden="true" />{{ selectedCard.config.dateLabel }} &amp; time</dt>
                  <dd>{{ formatSchedule(selectedCard.booking.startAt) }}</dd>
                </div>
                <div v-if="selectedCard.config.selectionKind !== 'time_slot'">
                  <dt><IonIcon :icon="calendarClearOutline" aria-hidden="true" />Ends</dt>
                  <dd>{{ formatSchedule(selectedCard.booking.endAt) }}</dd>
                </div>
                <div v-if="selectedCard.booking.estimatedTotal !== null">
                  <dt><IonIcon :icon="walletOutline" aria-hidden="true" />Estimated total</dt>
                  <dd>{{ formatNaira(selectedCard.booking.estimatedTotal) }}</dd>
                </div>
                <div>
                  <dt><IonIcon :icon="cardOutline" aria-hidden="true" />Payment</dt>
                  <dd>
                    <span class="booking-status" :class="paymentStatusClassMap[selectedCard.booking.paymentStatus]">
                      {{ paymentLabel(selectedCard.booking.paymentStatus) }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt><IonIcon :icon="personOutline" aria-hidden="true" />Agent / landlord</dt>
                  <dd>{{ selectedCard.ownerRole }}</dd>
                </div>
                <div>
                  <dt><IonIcon :icon="callOutline" aria-hidden="true" />Guest phone</dt>
                  <dd>{{ selectedCard.booking.guestPhone }}</dd>
                </div>
                <div>
                  <dt><IonIcon :icon="receiptOutline" aria-hidden="true" />Booking reference</dt>
                  <dd class="booking-reference">{{ selectedCard.booking.id }}</dd>
                </div>
              </dl>

              <div class="booking-status-bands">
                <section>
                  <span class="status-band-icon status-band-icon--payment"><IonIcon :icon="cardOutline" aria-hidden="true" /></span>
                  <div>
                    <p>Payment status</p>
                    <strong>{{ paymentLabel(selectedCard.booking.paymentStatus) }}</strong>
                  </div>
                  <small v-if="selectedCard.booking.estimatedTotal !== null">
                    {{ formatNaira(selectedCard.booking.estimatedTotal) }}
                  </small>
                </section>
                <section>
                  <span class="status-band-icon status-band-icon--reminder"><IonIcon :icon="notificationsOutline" aria-hidden="true" /></span>
                  <div>
                    <p>Reminder</p>
                    <strong>{{ selectedCard.booking.reminderSent ? 'Sent' : 'Pending' }}</strong>
                  </div>
                  <IonIcon
                    :icon="selectedCard.booking.reminderSent ? checkmarkCircleOutline : timeOutline"
                    aria-hidden="true"
                  />
                </section>
              </div>

              <section class="booking-timeline" aria-labelledby="booking-progress-title">
                <div class="booking-section-title">
                  <span><IonIcon :icon="gitBranchOutline" aria-hidden="true" /></span>
                  <div>
                    <p>Booking progress</p>
                    <h3 id="booking-progress-title">Current timeline</h3>
                  </div>
                </div>
                <ol>
                  <li
                    v-for="step in selectedTimeline"
                    :key="step.label"
                    :class="`booking-timeline--${step.state}`"
                  >
                    <i><IonIcon v-if="step.state === 'done'" :icon="checkmarkOutline" aria-hidden="true" /></i>
                    <span>
                      <strong>{{ step.label }}</strong>
                      <small>{{ step.copy }}</small>
                    </span>
                  </li>
                </ol>
              </section>

              <div v-if="selectedCard.booking.notes" class="booking-notes">
                <p>Notes</p>
                <span>{{ selectedCard.booking.notes }}</span>
              </div>

              <div class="booking-actions">
                <RouterLink :to="`/properties/${selectedCard.booking.propertyId}`" class="booking-action booking-action--secondary">
                  <IonIcon :icon="eyeOutline" aria-hidden="true" />
                  View property
                </RouterLink>
                <RouterLink
                  v-if="canCompletePayment(selectedCard.booking)"
                  :to="selectedCard.paymentRoute"
                  class="booking-action booking-action--primary"
                >
                  <IonIcon :icon="cardOutline" aria-hidden="true" />
                  Complete payment
                </RouterLink>
                <button
                  v-if="canCancel(selectedCard.booking)"
                  type="button"
                  class="booking-action booking-action--danger"
                  :disabled="isLoading"
                  @click="handleCancel(selectedCard.booking.id)"
                >
                  <IonIcon :icon="trashOutline" aria-hidden="true" />
                  {{ isLoading ? 'Updating...' : 'Cancel booking' }}
                </button>
              </div>
            </aside>
          </div>

          <div v-else-if="bookingCards.length" class="booking-state">
            <span><IonIcon :icon="searchOutline" aria-hidden="true" /></span>
            <h2>No matching bookings</h2>
            <p>Adjust the search, dates, or status filters to see more of your booking history.</p>
            <button type="button" @click="clearAllFilters">Clear filters</button>
          </div>

          <div v-else class="booking-state">
            <span><IonIcon :icon="calendarClearOutline" aria-hidden="true" /></span>
            <h2>No bookings yet</h2>
            <p>Your confirmed requests, schedules, payment state, and reminder status will appear here.</p>
            <RouterLink to="/properties">
              Browse listings
              <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
            </RouterLink>
          </div>
        </section>
      </main>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  arrowForwardOutline,
  businessOutline,
  calendarClearOutline,
  calendarOutline,
  callOutline,
  cardOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronDownOutline,
  chevronForwardOutline,
  closeOutline,
  cloudOfflineOutline,
  eyeOutline,
  funnelOutline,
  gitBranchOutline,
  locationOutline,
  notificationsOutline,
  personOutline,
  receiptOutline,
  refreshOutline,
  searchOutline,
  swapVerticalOutline,
  timeOutline,
  trashOutline,
  walletOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import { useAuth } from '../composables/useAuth'
import { useBookings } from '../composables/useBookings'
import { useNotifications } from '../composables/useNotifications'
import { useProperties } from '../composables/useProperties'
import { getBookingModeConfig, isInspectionMode, type BookingModeConfig } from '../services/bookingModes'
import { formatBookingStatusLabel, type BookingRecord, type BookingStatus } from '../types/booking'
import { formatNaira, formatPaymentStatusLabel, type PaymentStatus } from '../types/payment'
import type { PropertyRecord } from '../types/property'

type BookingTab = 'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending-payment'
type SortOrder = 'newest' | 'oldest'
type FilterStatus = BookingStatus | 'all'
type FilterPayment = PaymentStatus | 'all'
type TimelineState = 'done' | 'current' | 'pending'

interface BookingCard {
  booking: BookingRecord
  config: BookingModeConfig
  property: PropertyRecord | null
  propertyTitle: string
  propertyImage: string
  location: string
  address: string
  ownerRole: string
  paymentRoute: string
}

const { state, canManageProperties } = useAuth()
const { bookings, isLoading, refreshForUser, removeBooking } = useBookings()
const { properties, refresh } = useProperties()
const { runReminderScan } = useNotifications()
const route = useRoute()

const activeTab = ref<BookingTab>('all')
const searchQuery = ref('')
const fromDate = ref('')
const toDate = ref('')
const statusFilter = ref<FilterStatus>('all')
const paymentFilter = ref<FilterPayment>('all')
const propertyFilter = ref('all')
const sortOrder = ref<SortOrder>('newest')
const selectedBookingId = ref('')
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const loadError = ref('')
const isInitialLoading = ref(true)

const bookingStatusClassMap: Record<BookingStatus, string> = {
  pending: 'booking-status--pending',
  confirmed: 'booking-status--confirmed',
  completed: 'booking-status--completed',
  cancelled: 'booking-status--cancelled',
}

const paymentStatusClassMap: Record<PaymentStatus, string> = {
  success: 'booking-status--completed',
  pending: 'booking-status--pending',
  failed: 'booking-status--cancelled',
}

const bookingCards = computed<BookingCard[]>(() =>
  bookings.value.map((booking) => {
    const property = properties.value.find((item) => item.id === booking.propertyId) ?? null

    return {
      booking,
      config: getBookingModeConfig(booking.bookingMode),
      property,
      propertyTitle: property?.title ?? 'Property unavailable',
      propertyImage: property?.images[0] ?? '',
      location: property ? [property.area, property.city, property.state].filter(Boolean).join(', ') : 'Listing unavailable',
      address: property
        ? [property.address, property.area, property.city, property.state].filter(Boolean).join(', ')
        : 'This listing is no longer available.',
      ownerRole: property?.ownerRole ? titleCase(property.ownerRole) : 'Not provided',
      paymentRoute: isInspectionMode(booking.bookingMode)
        ? `/payment/${booking.propertyId}?type=inspection_fee`
        : `/payment/${booking.propertyId}?type=booking_payment&bookingId=${booking.id}`,
    }
  }),
)

const bookingMetrics = computed(() => {
  const active = bookings.value.filter((booking) => canCancel(booking)).length
  const paid = bookings.value.filter((booking) => booking.paymentStatus === 'success').length
  const reminded = bookings.value.filter((booking) => booking.reminderSent).length

  return [
    {
      label: 'Total bookings',
      value: String(bookings.value.length).padStart(2, '0'),
      copy: 'All booking records',
      icon: calendarClearOutline,
      tone: 'blue',
    },
    {
      label: 'Upcoming',
      value: String(active).padStart(2, '0'),
      copy: 'Active bookings',
      icon: timeOutline,
      tone: 'green',
    },
    {
      label: 'Paid',
      value: String(paid).padStart(2, '0'),
      copy: 'Settled payments',
      icon: cardOutline,
      tone: 'violet',
    },
    {
      label: 'Reminded',
      value: String(reminded).padStart(2, '0'),
      copy: 'Alerts sent',
      icon: notificationsOutline,
      tone: 'orange',
    },
  ]
})

const bookingTabs = computed(() => [
  { value: 'all' as const, label: 'All', count: bookings.value.length },
  {
    value: 'upcoming' as const,
    label: 'Upcoming',
    count: bookings.value.filter((booking) => canCancel(booking)).length,
  },
  {
    value: 'completed' as const,
    label: 'Completed',
    count: bookings.value.filter((booking) => booking.status === 'completed').length,
  },
  {
    value: 'cancelled' as const,
    label: 'Cancelled',
    count: bookings.value.filter((booking) => booking.status === 'cancelled').length,
  },
  {
    value: 'pending-payment' as const,
    label: 'Pending payment',
    count: bookings.value.filter(
      (booking) => booking.paymentStatus !== 'success' && booking.status !== 'cancelled',
    ).length,
  },
])

const propertyOptions = computed(() => {
  const options = new Map<string, string>()

  for (const item of bookingCards.value) {
    if (!options.has(item.booking.propertyId)) {
      options.set(item.booking.propertyId, item.propertyTitle)
    }
  }

  return [...options.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((left, right) => left.label.localeCompare(right.label))
})

const hasDetailFilters = computed(
  () => statusFilter.value !== 'all' || paymentFilter.value !== 'all' || propertyFilter.value !== 'all',
)
const hasActiveFilters = computed(
  () =>
    activeTab.value !== 'all' ||
    Boolean(searchQuery.value || fromDate.value || toDate.value) ||
    hasDetailFilters.value ||
    sortOrder.value !== 'newest',
)

const filteredBookingCards = computed(() => {
  const query = searchQuery.value.toLocaleLowerCase()
  const result = bookingCards.value.filter((item) => {
    const { booking } = item
    const matchesTab =
      activeTab.value === 'all' ||
      (activeTab.value === 'upcoming' && canCancel(booking)) ||
      (activeTab.value === 'completed' && booking.status === 'completed') ||
      (activeTab.value === 'cancelled' && booking.status === 'cancelled') ||
      (activeTab.value === 'pending-payment' &&
        booking.paymentStatus !== 'success' &&
        booking.status !== 'cancelled')
    const searchable = [
      item.propertyTitle,
      item.location,
      item.address,
      booking.id,
      booking.guestPhone,
      booking.listingCategory,
    ]
      .join(' ')
      .toLocaleLowerCase()
    const bookingDate = booking.inspectionDate || toIsoDate(booking.startAt)

    return (
      matchesTab &&
      (!query || searchable.includes(query)) &&
      (!fromDate.value || bookingDate >= fromDate.value) &&
      (!toDate.value || bookingDate <= toDate.value) &&
      (statusFilter.value === 'all' || booking.status === statusFilter.value) &&
      (paymentFilter.value === 'all' || booking.paymentStatus === paymentFilter.value) &&
      (propertyFilter.value === 'all' || booking.propertyId === propertyFilter.value)
    )
  })

  return result.sort((left, right) => {
    const difference = toTimestamp(left.booking.startAt) - toTimestamp(right.booking.startAt)
    return sortOrder.value === 'oldest' ? difference : -difference
  })
})

const selectedCard = computed(
  () =>
    filteredBookingCards.value.find((item) => item.booking.id === selectedBookingId.value) ??
    filteredBookingCards.value[0] ??
    null,
)

const selectedTimeline = computed(() => {
  if (!selectedCard.value) return []

  const booking = selectedCard.value.booking
  const isCancelled = booking.status === 'cancelled'
  const isPaid = booking.paymentStatus === 'success'
  const isConfirmed = booking.status === 'confirmed' || booking.status === 'completed'
  const isCompleted = booking.status === 'completed'

  if (isCancelled) {
    return [
      { label: 'Booking created', copy: formatDate(booking.createdAt), state: 'done' as TimelineState },
      {
        label: isPaid ? 'Payment settled' : 'Payment not completed',
        copy: paymentLabel(booking.paymentStatus),
        state: isPaid ? 'done' as TimelineState : 'pending' as TimelineState,
      },
      { label: 'Booking cancelled', copy: 'This booking is closed', state: 'current' as TimelineState },
    ]
  }

  return [
    { label: 'Booking created', copy: formatDate(booking.createdAt), state: 'done' as TimelineState },
    {
      label: isPaid ? 'Payment settled' : 'Payment pending',
      copy: paymentLabel(booking.paymentStatus),
      state: isPaid ? 'done' as TimelineState : 'current' as TimelineState,
    },
    {
      label: 'Booking confirmed',
      copy: isConfirmed ? formatScheduleCompact(booking.startAt) : 'Awaiting confirmation',
      state: isConfirmed ? 'done' as TimelineState : isPaid ? 'current' as TimelineState : 'pending' as TimelineState,
    },
    {
      label: 'Booking completed',
      copy: isCompleted ? 'Completed' : 'Not completed yet',
      state: isCompleted ? 'done' as TimelineState : isConfirmed ? 'current' as TimelineState : 'pending' as TimelineState,
    },
  ]
})

watch(
  () => state.profile?.uid,
  async (userId) => {
    await loadBookings(userId)
  },
  { immediate: true },
)

watch(
  filteredBookingCards,
  (items) => {
    if (!items.some((item) => item.booking.id === selectedBookingId.value)) {
      selectedBookingId.value = items[0]?.booking.id ?? ''
    }
  },
  { immediate: true },
)

watch(
  () => route.query.notice,
  (notice) => {
    if (notice === 'booking-created') {
      messageTone.value = 'success'
      message.value = 'Booking created successfully.'
    }
  },
  { immediate: true },
)

async function loadBookings(userId: string | null | undefined) {
  loadError.value = ''
  isInitialLoading.value = true

  try {
    await refresh()
    await refreshForUser(userId)

    if (userId) {
      await runReminderScan(userId).catch(() => undefined)
      await refreshForUser(userId)
    }
  } catch (error) {
    loadError.value = toErrorMessage(error, 'Could not load your bookings. Please try again.')
  } finally {
    isInitialLoading.value = false
  }
}

async function retryLoad() {
  await loadBookings(state.profile?.uid)
}

async function handleCancel(bookingId: string) {
  if (!state.profile) {
    showMessage('Sign in before cancelling a booking.', 'error')
    return
  }

  try {
    await removeBooking(bookingId, state.profile.uid)
    await refreshForUser(state.profile.uid)
    showMessage('Booking cancelled successfully.', 'success')
  } catch (error) {
    showMessage(toErrorMessage(error, 'Could not cancel the booking.'), 'error')
  }
}

function clearDateRange() {
  fromDate.value = ''
  toDate.value = ''
}

function clearDetailFilters() {
  statusFilter.value = 'all'
  paymentFilter.value = 'all'
  propertyFilter.value = 'all'
}

function clearAllFilters() {
  activeTab.value = 'all'
  searchQuery.value = ''
  clearDateRange()
  clearDetailFilters()
  sortOrder.value = 'newest'
}

function canCancel(booking: BookingRecord) {
  return booking.status !== 'cancelled' && booking.status !== 'completed'
}

function canCompletePayment(booking: BookingRecord) {
  return booking.paymentStatus !== 'success' && booking.status !== 'cancelled'
}

function paymentLabel(status: PaymentStatus) {
  return status === 'success' ? 'Paid' : titleCase(formatPaymentStatusLabel(status))
}

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getDateParts(value: string) {
  const date = safeDate(value)
  if (!date) return { month: '--', day: '--', year: '----' }

  return {
    month: new Intl.DateTimeFormat('en-NG', { month: 'short', timeZone: 'Africa/Lagos' })
      .format(date)
      .toUpperCase(),
    day: new Intl.DateTimeFormat('en-NG', { day: '2-digit', timeZone: 'Africa/Lagos' }).format(date),
    year: new Intl.DateTimeFormat('en-NG', { year: 'numeric', timeZone: 'Africa/Lagos' }).format(date),
  }
}

function formatSchedule(value: string) {
  const date = safeDate(value)
  if (!date) return 'Not provided'

  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatScheduleCompact(value: string) {
  const date = safeDate(value)
  if (!date) return 'Schedule unavailable'

  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatDate(value: string) {
  const date = safeDate(value)
  if (!date) return 'Not provided'

  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function toIsoDate(value: string) {
  const date = safeDate(value)
  if (!date) return ''
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

function toTimestamp(value: string) {
  return safeDate(value)?.getTime() ?? 0
}

function safeDate(value: string) {
  const date = new Date(value)
  return value && !Number.isNaN(date.getTime()) ? date : null
}

function showMessage(value: string, tone: 'success' | 'error') {
  message.value = value
  messageTone.value = tone
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
</script>

<style scoped>
.bookings-page {
  min-height: 100%;
  background: #f5f7fa;
}

.bookings-main {
  width: 100%;
  max-width: 1540px;
  margin: 0 auto;
  padding: 16px;
}

.bookings-hero {
  position: relative;
  display: flex;
  min-height: 164px;
  align-items: center;
  overflow: hidden;
  border: 1px solid #e4eaf1;
  border-radius: 20px;
  background: linear-gradient(104deg, #ffffff 0%, #ffffff 56%, #edf6ff 100%);
  box-shadow: 0 18px 46px -36px rgba(16, 32, 51, 0.48);
}

.bookings-hero-copy {
  position: relative;
  z-index: 2;
  max-width: 720px;
  padding: 28px 28px;
}

.bookings-eyebrow {
  color: #1d63d4;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.bookings-eyebrow span {
  margin: 0 6px;
  color: #8ca2be;
}

.bookings-hero h1 {
  margin: 11px 0 0;
  color: #102033;
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.12;
}

.bookings-hero-copy > p:last-child {
  max-width: 660px;
  margin: 10px 0 0;
  color: #66758a;
  font-size: 14px;
  line-height: 1.65;
}

.bookings-hero-art {
  position: absolute;
  inset: 0 0 0 auto;
  width: 39%;
  min-width: 390px;
  overflow: hidden;
  border-left: 1px solid rgba(199, 219, 241, 0.58);
  background: linear-gradient(130deg, rgba(255, 255, 255, 0.1), rgba(205, 231, 255, 0.72));
}

.hero-calendar {
  position: absolute;
  right: 18%;
  top: 50%;
  display: grid;
  width: 132px;
  height: 116px;
  place-items: center;
  transform: translateY(-47%) rotate(4deg);
  border: 1px solid rgba(112, 160, 214, 0.34);
  border-radius: 15px;
  background: #ffffff;
  box-shadow: 0 25px 42px -22px rgba(22, 75, 134, 0.46);
}

.hero-calendar::before {
  position: absolute;
  inset: 0 0 auto;
  height: 30px;
  border-radius: 14px 14px 0 0;
  background: #2d78e8;
  content: '';
}

.hero-calendar-rings {
  position: absolute;
  z-index: 1;
  top: -6px;
  display: flex;
  gap: 19px;
}

.hero-calendar-rings i {
  width: 6px;
  height: 22px;
  border-radius: 4px;
  background: #173d70;
  box-shadow: 0 0 0 3px #dcecff;
}

.hero-calendar strong {
  margin-top: 24px;
  color: #173d70;
  font-size: 34px;
  line-height: 1;
}

.hero-calendar small {
  margin-top: -12px;
  color: #7c8da2;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.hero-calendar > ion-icon {
  position: absolute;
  right: -12px;
  bottom: -10px;
  padding: 7px;
  border: 4px solid #edf6ff;
  border-radius: 50%;
  background: #ffffff;
  color: #1764c8;
  font-size: 26px;
}

.hero-bell {
  position: absolute;
  left: 14%;
  top: 44%;
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  transform: rotate(-8deg);
  border: 1px solid rgba(244, 171, 54, 0.32);
  border-radius: 50%;
  background: #fff8e8;
  color: #f0a321;
  box-shadow: 0 18px 32px -22px rgba(130, 85, 12, 0.6);
  font-size: 29px;
}

.booking-notice {
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  border: 1px solid;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 650;
}

.booking-notice ion-icon {
  flex: 0 0 auto;
  font-size: 20px;
}

.booking-notice--success {
  border-color: #bce8d1;
  background: #effbf4;
  color: #16734a;
}

.booking-notice--error {
  border-color: #fecdd3;
  background: #fff1f2;
  color: #be123c;
}

.booking-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.booking-metric {
  display: flex;
  min-width: 0;
  min-height: 118px;
  align-items: center;
  gap: 14px;
  border: 1px solid #e6ebf1;
  border-radius: 18px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 14px 34px -30px rgba(16, 32, 51, 0.54);
  transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
}

.booking-metric:hover {
  transform: translateY(-4px);
  border-color: #cbdcf0;
  box-shadow: 0 20px 40px -28px rgba(16, 32, 51, 0.45);
}

.metric-icon {
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  font-size: 24px;
}

.metric-icon--blue { background: #edf5ff; color: #1769dc; }
.metric-icon--green { background: #eaf9f0; color: #1b9b58; }
.metric-icon--violet { background: #f3efff; color: #7952dc; }
.metric-icon--orange { background: #fff6e7; color: #ef9417; }

.booking-metric div {
  min-width: 0;
}

.booking-metric p,
.booking-metric strong,
.booking-metric small {
  display: block;
}

.booking-metric p {
  margin: 0;
  color: #66758a;
  font-size: 12px;
  font-weight: 700;
}

.booking-metric strong {
  margin-top: 4px;
  color: #102033;
  font-size: 26px;
  line-height: 1;
}

.booking-metric small {
  margin-top: 7px;
  overflow: hidden;
  color: #8996a7;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booking-management {
  margin-top: 16px;
  overflow: visible;
  border: 1px solid #e3e9f0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 18px 46px -36px rgba(16, 32, 51, 0.48);
}

.booking-toolbar {
  border-bottom: 1px solid #e8edf3;
  padding: 16px;
}

.booking-tabs {
  display: flex;
  max-width: 100%;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.booking-tabs::-webkit-scrollbar { display: none; }

.booking-tabs button {
  display: inline-flex;
  min-height: 40px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  padding: 0 12px;
  color: #526276;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: background-color 190ms ease, color 190ms ease, transform 190ms ease;
}

.booking-tabs button:hover {
  background: #f1f6fc;
  color: #174f9e;
}

.booking-tabs button span {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #eef2f6;
  padding: 0 5px;
  color: #718096;
  font-size: 9px;
}

.booking-tabs .booking-tab--active {
  background: #edf5ff;
  color: #1763d1;
}

.booking-tabs .booking-tab--active span {
  background: #ffffff;
  color: #1763d1;
}

.booking-filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 9px;
  margin-top: 14px;
}

.booking-search,
.booking-sort,
.booking-filter-menu > summary {
  display: flex;
  min-width: 0;
  height: 44px;
  align-items: center;
  gap: 9px;
  border: 1px solid #dfe6ee;
  border-radius: 11px;
  background: #ffffff;
  color: #344256;
  transition: border-color 190ms ease, box-shadow 190ms ease;
}

.booking-search:focus-within,
.booking-sort:focus-within,
.booking-filter-menu[open] > summary {
  border-color: #76aef4;
  box-shadow: 0 0 0 3px rgba(46, 126, 226, 0.12);
}

.booking-search {
  padding: 0 10px 0 13px;
}

.booking-search > ion-icon {
  flex: 0 0 auto;
  color: #8190a3;
  font-size: 18px;
}

.booking-search input {
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  color: #102033;
  font-size: 12px;
}

.booking-search input::placeholder { color: #99a5b4; }

.booking-search button {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #f0f4f8;
  color: #5f6f83;
  cursor: pointer;
}

.booking-filter-menu {
  position: relative;
  min-width: 0;
}

.booking-filter-menu > summary {
  position: relative;
  justify-content: flex-start;
  padding: 0 12px;
  list-style: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.booking-filter-menu > summary::-webkit-details-marker { display: none; }
.booking-filter-menu > summary ion-icon:first-child { color: #66758a; font-size: 17px; }
.booking-filter-menu > summary ion-icon:last-child { margin-left: auto; font-size: 14px; }
.booking-filter-menu[open] > summary ion-icon:last-child { transform: rotate(180deg); }

.booking-filter-menu > summary i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1f6fe7;
}

.booking-filter-popover {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  width: min(280px, calc(100vw - 48px));
  gap: 12px;
  border: 1px solid #dfe6ee;
  border-radius: 14px;
  background: #ffffff;
  padding: 14px;
  box-shadow: 0 20px 45px -20px rgba(16, 32, 51, 0.34);
}

.booking-filter-popover label {
  display: grid;
  gap: 6px;
}

.booking-filter-popover label span {
  color: #58687c;
  font-size: 10px;
  font-weight: 800;
}

.booking-filter-popover input,
.booking-filter-popover select {
  width: 100%;
  height: 40px;
  border: 1px solid #dce4ed;
  border-radius: 9px;
  outline: 0;
  background: #ffffff;
  padding: 0 10px;
  color: #1c2b3e;
  font-size: 12px;
}

.booking-filter-popover input:focus,
.booking-filter-popover select:focus {
  border-color: #68a4ec;
  box-shadow: 0 0 0 3px rgba(46, 126, 226, 0.11);
}

.booking-filter-popover > button {
  min-height: 38px;
  border: 0;
  border-radius: 9px;
  background: #eef5fd;
  color: #1d63c7;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.booking-filter-popover > button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.booking-sort {
  padding: 0 11px;
}

.booking-sort ion-icon {
  flex: 0 0 auto;
  color: #66758a;
  font-size: 17px;
}

.booking-sort select {
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  color: #344256;
  font-size: 12px;
  font-weight: 700;
}

.booking-workspace {
  min-width: 0;
}

.booking-list-pane,
.booking-detail-pane {
  min-width: 0;
  padding: 16px;
}

.booking-list-heading {
  display: flex;
  min-height: 40px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.booking-list-heading h2 {
  margin: 0;
  color: #102033;
  font-size: 15px;
  font-weight: 800;
}

.booking-list-heading p {
  margin: 4px 0 0;
  color: #8491a3;
  font-size: 10px;
}

.booking-list-heading button {
  min-height: 34px;
  border: 0;
  background: transparent;
  color: #1d63c7;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.booking-list {
  display: grid;
  gap: 8px;
}

.booking-list-row {
  display: grid;
  min-width: 0;
  grid-template-columns: 70px minmax(0, 1fr) 34px;
  gap: 10px;
  align-items: center;
  border: 1px solid #e3e9f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 8px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease,
    background-color 200ms ease;
}

.booking-list-row:hover {
  transform: translateY(-3px);
  border-color: #bed7f5;
  box-shadow: 0 16px 28px -24px rgba(16, 32, 51, 0.6);
}

.booking-list-row--selected {
  border-color: #2a78ea;
  background: #fbfdff;
  box-shadow: 0 0 0 2px rgba(42, 120, 234, 0.08);
}

.booking-row-image {
  display: grid;
  width: 70px;
  aspect-ratio: 1 / 1;
  place-items: center;
  overflow: hidden;
  border-radius: 10px;
  background: #edf2f7;
  color: #8291a4;
  font-size: 23px;
}

.booking-row-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 210ms ease;
}

.booking-list-row:hover .booking-row-image img { transform: scale(1.03); }

.booking-date-block { display: none; }

.booking-row-copy {
  display: block;
  min-width: 0;
}

.booking-row-copy > strong,
.booking-row-copy > small,
.booking-row-copy > span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booking-row-copy > strong {
  color: #102033;
  font-size: 12px;
  font-weight: 800;
}

.booking-row-copy > small {
  margin-top: 3px;
  color: #728096;
  font-size: 10px;
}

.booking-row-copy > span {
  margin-top: 5px;
  color: #6d7c90;
  font-size: 9px;
}

.booking-row-copy > span ion-icon {
  margin-right: 3px;
  vertical-align: -1px;
}

.booking-status {
  display: inline-flex;
  width: fit-content;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 0 9px;
  font-size: 9px;
  font-style: normal;
  font-weight: 800;
  line-height: 1;
}

.booking-row-copy .booking-status { margin-top: 7px; }
.booking-status--pending { background: #fff4d6; color: #b96b05; }
.booking-status--confirmed { background: #e9f3ff; color: #1764c8; }
.booking-status--completed { background: #e6f8ee; color: #14864a; }
.booking-status--cancelled { background: #ffe9ed; color: #c72749; }

.booking-row-end {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.booking-row-end strong { display: none; }

.booking-row-end > ion-icon {
  margin: auto 0;
  color: #2671d9;
  font-size: 20px;
}

.booking-detail-pane {
  border-top: 1px solid #e8edf3;
}

.booking-detail-heading,
.booking-detail-heading > div,
.booking-section-title {
  display: flex;
  align-items: center;
}

.booking-detail-heading {
  justify-content: space-between;
  gap: 12px;
}

.booking-detail-heading > div,
.booking-section-title { gap: 10px; }

.booking-detail-icon,
.booking-section-title > span {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: #eef5ff;
  color: #1768d8;
  font-size: 21px;
}

.booking-detail-heading p,
.booking-section-title p {
  margin: 0;
  color: #6d7c90;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}

.booking-detail-heading h2,
.booking-section-title h3 {
  margin: 4px 0 0;
  color: #102033;
  font-size: 14px;
  font-weight: 800;
}

.booking-property-summary {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.booking-property-summary h3 {
  margin: 0;
  color: #102033;
  font-size: 21px;
  font-weight: 800;
}

.booking-property-summary p {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 7px 0 0;
  color: #6a798d;
  font-size: 11px;
  line-height: 1.6;
}

.booking-property-summary p ion-icon {
  margin-top: 2px;
  flex: 0 0 auto;
}

.booking-property-summary figure {
  display: grid;
  width: 100%;
  aspect-ratio: 16 / 8;
  place-items: center;
  overflow: hidden;
  margin: 0;
  border-radius: 14px;
  background: #eef2f6;
  color: #7b8a9e;
  font-size: 28px;
}

.booking-property-summary figure img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 210ms ease;
}

.booking-property-summary figure:hover img { transform: scale(1.03); }

.booking-detail-grid {
  display: grid;
  gap: 0;
  margin: 18px 0 0;
  border-top: 1px solid #e8edf3;
}

.booking-detail-grid > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 12px;
  align-items: center;
  min-height: 43px;
  border-bottom: 1px solid #eef2f6;
}

.booking-detail-grid dt {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: #748297;
  font-size: 10px;
}

.booking-detail-grid dt ion-icon {
  flex: 0 0 auto;
  color: #52657d;
  font-size: 15px;
}

.booking-detail-grid dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #16263a;
  font-size: 10px;
  font-weight: 750;
  text-align: right;
}

.booking-reference {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 8px !important;
}

.booking-status-bands {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.booking-status-bands section {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 58px;
  border-top: 1px solid #e8edf3;
  padding-top: 10px;
}

.status-band-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  font-size: 18px;
}

.status-band-icon--payment { background: #fff6e4; color: #dd8b12; }
.status-band-icon--reminder { background: #edf7ff; color: #2274d8; }

.booking-status-bands p,
.booking-status-bands strong {
  display: block;
  margin: 0;
}

.booking-status-bands p { color: #7a8798; font-size: 9px; }
.booking-status-bands strong { margin-top: 3px; color: #1d2d40; font-size: 11px; }
.booking-status-bands small { color: #536278; font-size: 10px; font-weight: 800; }
.booking-status-bands section > ion-icon { color: #1d9c5a; font-size: 19px; }

.booking-timeline {
  margin-top: 18px;
  border-top: 1px solid #e8edf3;
  padding-top: 16px;
}

.booking-timeline ol {
  display: grid;
  gap: 0;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}

.booking-timeline li {
  position: relative;
  display: grid;
  min-height: 46px;
  grid-template-columns: 23px minmax(0, 1fr);
  gap: 9px;
}

.booking-timeline li:not(:last-child)::after {
  position: absolute;
  left: 10px;
  top: 20px;
  width: 2px;
  height: 26px;
  background: #dfe6ee;
  content: '';
}

.booking-timeline li > i {
  position: relative;
  z-index: 1;
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  border: 2px solid #d8e0e9;
  border-radius: 50%;
  background: #ffffff;
  color: #ffffff;
  font-size: 12px;
}

.booking-timeline li span strong,
.booking-timeline li span small { display: block; }
.booking-timeline li span strong { color: #66758a; font-size: 10px; }
.booking-timeline li span small { margin-top: 2px; color: #9aa5b2; font-size: 8px; }
.booking-timeline--done > i { border-color: #239b5c !important; background: #239b5c !important; }
.booking-timeline--done:not(:last-child)::after { background: #80caa4 !important; }
.booking-timeline--done span strong { color: #1d2d40 !important; }
.booking-timeline--current > i { border-color: #2877e6 !important; box-shadow: inset 0 0 0 4px #ffffff; background: #2877e6 !important; }
.booking-timeline--current span strong { color: #1f65c8 !important; }

.booking-notes {
  margin-top: 14px;
  border-top: 1px solid #e8edf3;
  padding-top: 14px;
}

.booking-notes p { margin: 0; color: #6b798c; font-size: 9px; font-weight: 800; text-transform: uppercase; }
.booking-notes span { display: block; margin-top: 6px; color: #344256; font-size: 10px; line-height: 1.6; }

.booking-actions {
  display: grid;
  gap: 8px;
  margin-top: 18px;
  border-top: 1px solid #e8edf3;
  padding-top: 16px;
}

.booking-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 11px;
  padding: 0 14px;
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition: transform 190ms ease, box-shadow 190ms ease, background-color 190ms ease,
    border-color 190ms ease;
}

.booking-action:hover { transform: translateY(-3px); }
.booking-action--secondary { border-color: #dce4ed; background: #ffffff; color: #344256; }
.booking-action--primary { border-color: #246fe0; background: #246fe0; color: #ffffff; box-shadow: 0 14px 24px -18px rgba(36, 111, 224, 0.8); }
.booking-action--danger { border-color: #f0a8b5; background: #fff7f8; color: #c81e45; }
.booking-action:disabled { cursor: not-allowed; opacity: 0.55; transform: none; }

.booking-state {
  display: grid;
  min-height: 360px;
  place-items: center;
  align-content: center;
  padding: 38px 20px;
  text-align: center;
}

.booking-state > span {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 16px;
  background: #edf5ff;
  color: #2774dc;
  font-size: 27px;
}

.booking-state h2 { margin: 16px 0 0; color: #102033; font-size: 20px; font-weight: 800; }
.booking-state p { max-width: 420px; margin: 8px 0 0; color: #6c7b8f; font-size: 12px; line-height: 1.7; }
.booking-state > button,
.booking-state > a {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  border: 0;
  border-radius: 11px;
  background: #246fe0;
  padding: 0 18px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.booking-state--error > span { background: #fff0f2; color: #d3294c; }
.booking-state--error > button { background: #1b2b3f; }

.booking-row-skeleton,
.booking-detail-skeleton {
  animation: booking-pulse 1.5s ease-in-out infinite;
}

.booking-row-skeleton {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  margin-bottom: 9px;
  border: 1px solid #edf1f5;
  border-radius: 14px;
  padding: 9px;
}

.booking-row-skeleton > span { width: 72px; aspect-ratio: 1; border-radius: 10px; background: #edf1f5; }
.booking-row-skeleton div { display: grid; align-content: center; gap: 9px; }
.booking-row-skeleton i { display: block; height: 9px; border-radius: 5px; background: #edf1f5; }
.booking-row-skeleton i:nth-child(1) { width: 48%; }
.booking-row-skeleton i:nth-child(2) { width: 72%; }
.booking-row-skeleton i:nth-child(3) { width: 34%; }
.booking-detail-skeleton { border-top: 1px solid #e8edf3; }
.booking-detail-skeleton span { display: block; width: 100%; aspect-ratio: 16 / 7; border-radius: 14px; background: #edf1f5; }
.booking-detail-skeleton i { display: block; width: 100%; height: 10px; margin-top: 15px; border-radius: 5px; background: #edf1f5; }
.booking-detail-skeleton i:nth-child(3) { width: 76%; }
.booking-detail-skeleton i:nth-child(4) { width: 88%; }
.booking-detail-skeleton i:nth-child(5) { width: 52%; }

@keyframes booking-pulse {
  50% { opacity: 0.55; }
}

.booking-tabs button:focus-visible,
.booking-search button:focus-visible,
.booking-filter-menu > summary:focus-visible,
.booking-filter-popover button:focus-visible,
.booking-sort:focus-within,
.booking-list-row:focus-visible,
.booking-list-heading button:focus-visible,
.booking-action:focus-visible,
.booking-state a:focus-visible,
.booking-state button:focus-visible {
  outline: 3px solid rgba(49, 130, 231, 0.28);
  outline-offset: 2px;
}

@media (min-width: 560px) {
  .booking-filter-bar {
    grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(120px, auto));
  }

  .booking-list-row {
    grid-template-columns: 78px 56px minmax(0, 1fr) 74px;
    gap: 10px;
    padding: 9px;
  }

  .booking-row-image { width: 78px; }

  .booking-date-block {
    display: flex;
    height: 64px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #f7f9fc;
    color: #25405f;
  }

  .booking-date-block small { font-size: 8px; font-weight: 800; }
  .booking-date-block strong { margin-top: 1px; font-size: 19px; line-height: 1; }
  .booking-date-block span { margin-top: 3px; font-size: 8px; }
  .booking-row-end strong { display: block; color: #1d2c40; font-size: 9px; }
  .booking-row-end > ion-icon { margin: auto 4px 0 0; }

  .booking-property-summary {
    grid-template-columns: minmax(0, 1fr) 176px;
    align-items: center;
  }

  .booking-property-summary figure { aspect-ratio: 4 / 3; }
  .booking-status-bands { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .booking-status-bands section:nth-child(2) { border-left: 1px solid #e8edf3; padding-left: 12px; }
  .booking-actions { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 760px) {
  .bookings-main { padding: 22px; }
  .booking-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
  .booking-metric { min-height: 108px; padding: 15px; }
  .metric-icon { width: 46px; height: 46px; font-size: 21px; }
  .booking-toolbar { padding: 16px 18px; }
  .booking-list-pane,
  .booking-detail-pane { padding: 18px; }
}

@media (min-width: 1024px) {
  .bookings-page {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    align-items: start;
    gap: 18px;
    padding: 20px;
  }

  .bookings-main { min-width: 0; padding: 0; }

  :deep(nav[aria-label='Primary navigation']) { display: none; }
}

@media (min-width: 1280px) {
  .booking-toolbar {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(620px, 1fr);
    align-items: center;
    gap: 16px;
  }

  .booking-filter-bar { margin-top: 0; }

  .booking-workspace {
    display: grid;
    grid-template-columns: minmax(430px, 0.88fr) minmax(500px, 1.12fr);
  }

  .booking-list-pane {
    border-right: 1px solid #e8edf3;
  }

  .booking-list {
    max-height: 680px;
    overflow-y: auto;
    padding: 2px 4px 4px 2px;
    scrollbar-color: #cbd5e1 transparent;
    scrollbar-width: thin;
  }

  .booking-detail-pane {
    border-top: 0;
  }

  .booking-detail-skeleton { border-top: 0; }
}

@media (min-width: 1440px) {
  .bookings-page { grid-template-columns: 216px minmax(0, 1fr); gap: 20px; }
  .bookings-main { max-width: 1580px; }
  .booking-metric { min-height: 112px; padding: 17px; }
  .booking-toolbar { grid-template-columns: minmax(460px, auto) minmax(650px, 1fr); }
  .booking-list-row { grid-template-columns: 84px 58px minmax(0, 1fr) 82px; }
  .booking-row-image { width: 84px; }
}

@media (max-width: 759px) {
  .bookings-hero-art { display: none; }
  .bookings-hero { min-height: 150px; }
  .bookings-hero-copy { padding: 24px 20px; }
  .bookings-hero h1 { font-size: 27px; }
}

@media (max-width: 559px) {
  .booking-metric { min-height: 100px; align-items: flex-start; gap: 10px; padding: 13px; }
  .metric-icon { width: 38px; height: 38px; border-radius: 11px; font-size: 18px; }
  .booking-metric strong { font-size: 22px; }
  .booking-metric small { font-size: 8px; }
  .booking-toolbar { padding: 13px; }
  .booking-filter-popover { right: auto; left: 0; }
  .booking-filter-menu:nth-of-type(3) .booking-filter-popover { right: 0; left: auto; }
  .booking-detail-heading { align-items: flex-start; }
  .booking-property-summary h3 { font-size: 18px; }
  .booking-detail-grid > div { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); }
}

@media (prefers-reduced-motion: reduce) {
  .booking-metric,
  .booking-list-row,
  .booking-row-image img,
  .booking-property-summary figure img,
  .booking-action {
    transition: none;
  }

  .booking-row-skeleton,
  .booking-detail-skeleton { animation: none; }
}

:global(.dark) .bookings-page { background: #0c1420; }
:global(.dark) .bookings-hero,
:global(.dark) .booking-metric,
:global(.dark) .booking-management,
:global(.dark) .booking-search,
:global(.dark) .booking-sort,
:global(.dark) .booking-filter-menu > summary,
:global(.dark) .booking-filter-popover,
:global(.dark) .booking-filter-popover input,
:global(.dark) .booking-filter-popover select,
:global(.dark) .booking-list-row,
:global(.dark) .booking-timeline li > i {
  border-color: #273446;
  background: #121d2b;
}

:global(.dark) .bookings-hero { background: #121d2b; }
:global(.dark) .bookings-hero h1,
:global(.dark) .booking-metric strong,
:global(.dark) .booking-search input,
:global(.dark) .booking-filter-popover input,
:global(.dark) .booking-filter-popover select,
:global(.dark) .booking-list-heading h2,
:global(.dark) .booking-row-copy > strong,
:global(.dark) .booking-detail-heading h2,
:global(.dark) .booking-property-summary h3,
:global(.dark) .booking-detail-grid dd,
:global(.dark) .booking-section-title h3,
:global(.dark) .booking-timeline--done span strong,
:global(.dark) .booking-state h2 {
  color: #f8fafc !important;
}

:global(.dark) .booking-detail-pane,
:global(.dark) .booking-toolbar,
:global(.dark) .booking-list-pane,
:global(.dark) .booking-detail-grid,
:global(.dark) .booking-detail-grid > div,
:global(.dark) .booking-status-bands section,
:global(.dark) .booking-timeline,
:global(.dark) .booking-notes,
:global(.dark) .booking-actions {
  border-color: #273446;
}
</style>
