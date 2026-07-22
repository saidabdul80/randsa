<template>
  <AppShell
    :show-header="false"
    content-class="min-h-full w-full pb-28 lg:pb-0"
  >
    <div class="booking-page-layout">
      <aside class="booking-desktop-nav" aria-label="Booking navigation">
        <div class="booking-brand" aria-label="RANDSA">
          <span aria-hidden="true">R</span>
          <strong>RANDSA</strong>
        </div>

        <nav class="booking-nav-links" aria-label="Primary booking navigation">
          <RouterLink
            v-for="item in bookingNavigationItems"
            :key="item.label"
            :to="item.to"
            class="booking-nav-link"
            :class="{ 'booking-nav-link--active': isBookingNavActive(item.matchers) }"
          >
            <IonIcon :icon="item.icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <RouterLink
          to="/profile"
          class="booking-profile-card"
          title="Account Center"
          aria-label="Open Account Center"
        >
          <img
            v-if="state.profile?.photoURL"
            :src="state.profile.photoURL"
            :alt="state.profile.fullName"
            loading="lazy"
          >
          <span v-else class="booking-profile-avatar" aria-hidden="true">{{ profileInitial }}</span>
          <span class="booking-profile-copy">
            <strong>{{ state.profile?.fullName || 'RANDSA account' }}</strong>
            <small>{{ profileRoleLabel }}</small>
          </span>
          <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
        </RouterLink>
      </aside>

      <main class="booking-main-content">
        <section class="booking-hero" aria-labelledby="booking-title">
      <div class="booking-hero-copy">
        <span class="booking-hero-icon" aria-hidden="true">
          <IonIcon :icon="calendarOutline" />
        </span>
        <div>
          <p class="booking-eyebrow">Universal booking</p>
          <h1 id="booking-title">{{ bookingModeConfig.title }}</h1>
          <p>{{ bookingModeConfig.description }}</p>
        </div>
      </div>

      <div class="booking-hero-media">
        <img
          v-if="propertyImage"
          :src="propertyImage"
          :alt="property ? `${property.title} property` : 'Selected property'"
          loading="lazy"
          decoding="async"
        >
        <div v-else class="booking-image-placeholder">
          <IonIcon :icon="businessOutline" aria-hidden="true" />
          <span>Property image unavailable</span>
        </div>
      </div>
        </section>

        <section class="booking-layout" :aria-label="`${bookingModeConfig.title} details`">
      <div class="booking-card booking-form-card">
        <div class="booking-section-heading">
          <div>
            <p class="booking-eyebrow">Booking details</p>
            <h2>{{ bookingModeConfig.title }}</h2>
          </div>
          <span class="secure-chip">
            <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />
            Secure request
          </span>
        </div>

        <div
          v-if="message"
          class="booking-message"
          :class="messageTone === 'success' ? 'booking-message--success' : 'booking-message--error'"
          role="status"
          aria-live="polite"
        >
          <IonIcon
            :icon="messageTone === 'success' ? checkmarkCircleOutline : alertCircleOutline"
            aria-hidden="true"
          />
          <span>{{ message }}</span>
        </div>

        <form class="booking-form" @submit.prevent="handleSubmit">
          <div class="booking-fields-grid">
            <div v-if="usesSlotSelection" ref="datePickerRoot" class="booking-field booking-popover-field">
              <label id="inspection-date-label">{{ bookingModeConfig.dateLabel }}</label>
              <button
                type="button"
                class="booking-input booking-picker-trigger"
                aria-haspopup="dialog"
                :aria-expanded="isCalendarOpen"
                aria-labelledby="inspection-date-label inspection-date-value"
                @click="openCalendar"
                @keydown.esc="isCalendarOpen = false"
              >
                <IonIcon :icon="calendarOutline" aria-hidden="true" />
                <span id="inspection-date-value" :class="{ 'booking-placeholder': !form.inspectionDate }">
                  {{ formattedInspectionDate || 'Choose a date' }}
                </span>
                <IonIcon :icon="chevronDownOutline" class="picker-chevron" aria-hidden="true" />
              </button>

              <Transition name="booking-popover">
                <div
                  v-if="isCalendarOpen"
                  class="calendar-popover"
                  role="dialog"
                  aria-modal="false"
                  aria-labelledby="calendar-heading"
                  @keydown.esc.stop="isCalendarOpen = false"
                >
                  <div class="calendar-header">
                    <button
                      type="button"
                      class="calendar-nav-button"
                      :disabled="!canGoToPreviousMonth"
                      aria-label="Previous month"
                      @click="shiftCalendarMonth(-1)"
                    >
                      <IonIcon :icon="chevronBackOutline" />
                    </button>
                    <h3 id="calendar-heading" aria-live="polite">{{ displayedMonthLabel }}</h3>
                    <button
                      type="button"
                      class="calendar-nav-button"
                      aria-label="Next month"
                      @click="shiftCalendarMonth(1)"
                    >
                      <IonIcon :icon="chevronForwardOutline" />
                    </button>
                  </div>

                  <div class="calendar-weekdays" aria-hidden="true">
                    <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
                  </div>

                  <div class="calendar-grid" role="grid" :aria-label="`Choose ${bookingModeConfig.dateLabel.toLowerCase()}`">
                    <template v-for="cell in calendarDays" :key="cell.key">
                      <span v-if="!cell.iso" class="calendar-empty" aria-hidden="true" />
                      <button
                        v-else
                        type="button"
                        class="calendar-day"
                        :class="[
                          `calendar-day--${cell.availabilityState}`,
                          {
                            'calendar-day--today': cell.isToday,
                            'calendar-day--selected': calendarSelection === cell.iso,
                            'calendar-day--disabled': cell.disabled,
                          },
                        ]"
                        :data-calendar-date="cell.iso"
                        :aria-label="`${cell.ariaLabel}. ${cell.availabilityLabel}. ${cell.availabilityDescription}`"
                        :aria-disabled="cell.disabled"
                        :aria-selected="calendarSelection === cell.iso"
                        :title="`${cell.availabilityLabel}: ${cell.availabilityDescription}`"
                        role="gridcell"
                        @click="selectCalendarCell(cell)"
                        @keydown="handleCalendarDayKeydown($event, cell.iso)"
                      >
                        <span>{{ cell.day }}</span>
                        <i class="calendar-availability-dot" aria-hidden="true" />
                      </button>
                    </template>
                  </div>

                  <div class="calendar-legend" aria-label="Availability legend">
                    <span><i class="legend-dot legend-dot--available" />Available</span>
                    <span><i class="legend-dot legend-dot--limited" />Limited</span>
                    <span><i class="legend-dot legend-dot--full" />Fully booked</span>
                    <span><i class="legend-dot legend-dot--disabled" />Unavailable</span>
                  </div>

                  <p v-if="calendarFeedback" class="calendar-feedback" role="status">
                    {{ calendarFeedback }}
                  </p>
                  <p v-else-if="isRefreshingAvailability" class="calendar-refresh-note" role="status">
                    Refreshing known availability...
                  </p>
                  <p v-else-if="availabilityLoadError" class="calendar-refresh-note calendar-refresh-note--error">
                    Live availability could not refresh. Showing the configured inspection schedule.
                  </p>

                  <div class="calendar-footer">
                    <button type="button" class="calendar-text-button" @click="clearDateSelection">
                      Clear
                    </button>
                    <button type="button" class="calendar-text-button" @click="selectToday">
                      Today
                    </button>
                    <button
                      type="button"
                      class="calendar-apply-button"
                      :disabled="!calendarSelection"
                      @click="applyCalendarSelection"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <div v-if="usesSlotSelection" ref="timePickerRoot" class="booking-field booking-popover-field">
              <label id="inspection-time-label">{{ bookingModeConfig.startTimeLabel }}</label>
              <button
                type="button"
                class="booking-input booking-picker-trigger"
                aria-haspopup="listbox"
                :aria-expanded="isTimePickerOpen"
                :disabled="!form.inspectionDate"
                aria-labelledby="inspection-time-label inspection-time-value"
                @click="openTimePicker"
                @keydown.esc="isTimePickerOpen = false"
              >
                <IonIcon :icon="timeOutline" aria-hidden="true" />
                <span id="inspection-time-value" :class="{ 'booking-placeholder': !form.inspectionTime }">
                  {{ formattedInspectionTime || 'Choose a time' }}
                </span>
                <IonIcon :icon="chevronDownOutline" class="picker-chevron" aria-hidden="true" />
              </button>

              <Transition name="booking-popover">
                <div
                  v-if="isTimePickerOpen"
                  class="time-popover"
                  @keydown.esc.stop="isTimePickerOpen = false"
                >
                  <div class="time-popover-header">
                    <div>
                      <h3>Available times</h3>
                      <p>{{ selectedDateAvailability?.description ?? 'Choose an available date first' }}</p>
                    </div>
                    <button type="button" @click="clearTimeSelection">Clear</button>
                  </div>
                  <div class="time-slot-grid" role="listbox" :aria-label="`Available ${bookingModeConfig.startTimeLabel.toLowerCase()}s`">
                    <button
                      v-for="slot in timeSlots"
                      :key="slot.value"
                      type="button"
                      class="time-slot"
                      :class="{ 'time-slot--selected': form.inspectionTime === slot.value }"
                      :disabled="!slot.available"
                      :aria-selected="form.inspectionTime === slot.value"
                      :title="slot.available ? 'Available' : 'Unavailable'"
                      role="option"
                      @click="selectTimeSlot(slot.value)"
                    >
                      {{ slot.label }}
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <template v-if="!usesSlotSelection">
              <div class="booking-field">
                <label for="booking-start-date">{{ bookingModeConfig.dateLabel }}</label>
                <input
                  id="booking-start-date"
                  v-model="form.inspectionDate"
                  class="booking-input booking-native-input"
                  type="date"
                  :min="todayIso"
                >
              </div>
              <div class="booking-field">
                <label for="booking-start-time">{{ bookingModeConfig.startTimeLabel }}</label>
                <input
                  id="booking-start-time"
                  v-model="form.inspectionTime"
                  class="booking-input booking-native-input"
                  type="time"
                >
              </div>
              <div v-if="bookingModeConfig.selectionKind === 'date_time_range'" class="booking-field">
                <label for="booking-end-date">{{ bookingModeConfig.endDateLabel }}</label>
                <input
                  id="booking-end-date"
                  v-model="form.endDate"
                  class="booking-input booking-native-input"
                  type="date"
                  :min="form.inspectionDate || todayIso"
                >
              </div>
              <div class="booking-field">
                <label for="booking-end-time">{{ bookingModeConfig.endTimeLabel }}</label>
                <input
                  id="booking-end-time"
                  v-model="form.endTime"
                  class="booking-input booking-native-input"
                  type="time"
                >
              </div>
            </template>

            <div class="booking-field">
              <label for="guest-phone">{{ isInspectionBookingMode ? 'Guest phone' : 'Customer phone' }}</label>
              <div class="booking-input booking-text-input">
                <IonIcon :icon="callOutline" aria-hidden="true" />
                <input
                  id="guest-phone"
                  v-model="form.guestPhone"
                  type="tel"
                  autocomplete="tel"
                  placeholder="+234..."
                >
              </div>
            </div>

            <div class="booking-field booking-field--wide">
              <label for="inspection-notes">{{ isInspectionBookingMode ? 'Notes' : 'Notes or special request' }}</label>
              <textarea
                id="inspection-notes"
                v-model="form.notes"
                rows="4"
                class="booking-input booking-textarea"
                :placeholder="isInspectionBookingMode
                  ? 'Gate description, meeting notes, or a request for the landlord or agent.'
                  : 'Add any useful request for the listing contact.'"
              />
              <p class="field-hint">Optional details that will help the property contact prepare.</p>
            </div>
          </div>

          <div class="booking-actions">
            <RouterLink
              v-if="property && isInspectionBookingMode"
              :to="paymentRoute"
              class="booking-button booking-button--secondary"
            >
              Manage inspection payment
            </RouterLink>
            <button
              type="submit"
              class="booking-button booking-button--primary"
              :disabled="!property || !state.profile || isLoading"
            >
              <span>{{ isLoading ? 'Saving booking...' : bookingModeConfig.primaryActionLabel }}</span>
              <IonIcon
                :icon="isLoading ? syncOutline : arrowForwardOutline"
                :class="{ 'booking-spinner': isLoading }"
                aria-hidden="true"
              />
            </button>
          </div>
        </form>
      </div>

      <aside class="booking-sidebar" aria-label="Property and payment summary">
        <article class="booking-card property-summary-card">
          <div class="property-summary-image">
            <img
              v-if="propertyImage"
              :src="propertyImage"
              :alt="property ? property.title : 'Selected property'"
              loading="lazy"
              decoding="async"
            >
            <div v-else class="booking-image-placeholder">
              <IonIcon :icon="businessOutline" aria-hidden="true" />
            </div>
          </div>

          <div class="property-summary-content">
            <p class="booking-eyebrow">Listing summary</p>
            <template v-if="property">
              <h2>{{ property.title }}</h2>
              <p class="property-address">
                <IonIcon :icon="locationOutline" aria-hidden="true" />
                <span>{{ propertyAddress }}</span>
              </p>

              <dl class="property-facts">
                <div>
                  <dt><IonIcon :icon="cashOutline" aria-hidden="true" /> {{ bookingModeConfig.paymentLabel }}</dt>
                  <dd>{{ formatNaira(bookingRate) }}</dd>
                </div>
                <div>
                  <dt><IonIcon :icon="personOutline" aria-hidden="true" /> Contact role</dt>
                  <dd>{{ propertyContactRole }}</dd>
                </div>
                <div>
                  <dt><IonIcon :icon="callOutline" aria-hidden="true" /> Phone</dt>
                  <dd>{{ property.ownerPhone || 'Not provided' }}</dd>
                </div>
              </dl>
            </template>
            <p v-else class="empty-copy">
              Open this page from a property listing to create a booking tied to that property.
            </p>
          </div>
        </article>

        <UniversalBookingSummary
          :property="property"
          :config="bookingModeConfig"
          :selection="normalizedSelection"
        />

        <article class="booking-card payment-card">
          <div class="summary-card-heading">
            <div>
              <p class="booking-eyebrow">{{ bookingModeConfig.paymentLabel }}</p>
              <h2>{{ paymentHeading }}</h2>
            </div>
            <span class="payment-badge" :class="paymentBadgeClass">
              <IonIcon :icon="paymentBadgeIcon" aria-hidden="true" />
              {{ paymentBadgeLabel }}
            </span>
          </div>

          <div class="payment-amount-row">
            <div>
              <span>{{ bookingModeConfig.paymentLabel }}</span>
              <strong>{{ property ? formatNaira(bookingRate) : 'Not available' }}</strong>
            </div>
            <IonIcon :icon="receiptOutline" aria-hidden="true" />
          </div>

          <div v-if="latestInspectionPayment" class="payment-reference">
            <span>Payment reference</span>
            <strong>{{ latestInspectionPayment.paystackReference }}</strong>
          </div>
          <p v-else class="payment-copy">{{ paymentStatusMessage }}</p>

          <RouterLink v-if="property && isInspectionBookingMode" :to="paymentRoute" class="payment-link">
            <span>{{ paymentActionLabel }}</span>
            <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
          </RouterLink>
          <p v-else class="payment-copy">Complete the reservation first. Its estimated total will then be available in My bookings.</p>
        </article>

        <article class="booking-card reminder-card">
          <div class="summary-card-heading">
            <div>
              <p class="booking-eyebrow">Reminder delivery</p>
              <h2>{{ bookingModeConfig.reminderTitle }}</h2>
            </div>
            <span class="reminder-icon" aria-hidden="true">
              <IonIcon :icon="notificationsOutline" />
            </span>
          </div>

          <ul class="reminder-list">
            <li>
              <IonIcon :icon="notificationsOutline" aria-hidden="true" />
              <div><strong>App notification</strong><span>Created by the reminder scan</span></div>
            </li>
            <li>
              <IonIcon :icon="timeOutline" aria-hidden="true" />
              <div><strong>Reminder timing</strong><span>When the booking is within 24 hours</span></div>
            </li>
          </ul>
        </article>
      </aside>
        </section>

        <footer class="booking-trust-strip">
          <span aria-hidden="true"><IonIcon :icon="shieldCheckmarkOutline" /></span>
          <div>
            <strong>Secure and trusted</strong>
            <p>Your booking information stays connected to your signed-in RANDSA account.</p>
          </div>
        </footer>
      </main>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  addCircleOutline,
  arrowForwardOutline,
  bookmarkOutline,
  businessOutline,
  calendarClearOutline,
  calendarOutline,
  callOutline,
  cardOutline,
  cashOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  gridOutline,
  homeOutline,
  locationOutline,
  notificationsOutline,
  personOutline,
  receiptOutline,
  shieldCheckmarkOutline,
  syncOutline,
  timeOutline,
} from 'ionicons/icons'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import UniversalBookingSummary from '../components/booking/UniversalBookingSummary.vue'
import { useAuth } from '../composables/useAuth'
import { useBookings } from '../composables/useBookings'
import { useNotifications } from '../composables/useNotifications'
import { usePayments } from '../composables/usePayments'
import { useProperties } from '../composables/useProperties'
import {
  calculateInspectionDateAvailability,
  createDefaultInspectionAvailabilityConfig,
  loadKnownPropertyInspectionBookings,
  type InspectionAvailabilityState,
} from '../services/inspectionAvailability'
import {
  findBookingConflict,
  type BookingAvailabilityBlock,
} from '../services/bookingAvailability'
import {
  getBookingModeConfig,
  isInspectionMode,
  normalizeBookingSelection,
  resolveBookingMode,
  usesTimeSlotTimeline,
} from '../services/bookingModes'
import { createEmptyBookingInput, type BookingInput } from '../types/booking'
import { formatNaira } from '../types/payment'

interface CalendarCell {
  key: string
  day: number | null
  iso: string
  disabled: boolean
  isToday: boolean
  ariaLabel: string
  availabilityState: InspectionAvailabilityState
  availabilityLabel: string
  availabilityDescription: string
}

const route = useRoute()
const router = useRouter()
const propertyId = computed(() => (route.params.propertyId as string | undefined) ?? '')

const { canManageProperties, state } = useAuth()
const { findById } = useProperties()
const { isLoading, saveBooking } = useBookings()
const { findLatestPaymentForUserProperty } = usePayments()
const { addBookingConfirmation } = useNotifications()

const property = ref<Awaited<ReturnType<typeof findById>>>(null)
const latestInspectionPayment = ref<Awaited<ReturnType<typeof findLatestPaymentForUserProperty>>>(null)
const form = reactive<BookingInput>(createEmptyBookingInput())
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const knownPropertyBookings = ref<BookingAvailabilityBlock[]>([])
const isRefreshingAvailability = ref(false)
const availabilityLoadError = ref('')
const calendarFeedback = ref('')

const datePickerRoot = ref<HTMLElement | null>(null)
const timePickerRoot = ref<HTMLElement | null>(null)
const isCalendarOpen = ref(false)
const isTimePickerOpen = ref(false)
const calendarSelection = ref('')
const today = startOfDay(new Date())
const todayIso = formatIsoDate(today)
const displayedMonth = ref(startOfMonth(today))
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const propertyImage = computed(() => property.value?.images[0] ?? '')
const bookingMode = computed(() => resolveBookingMode(property.value))
const bookingModeConfig = computed(() => getBookingModeConfig(bookingMode.value))
const isInspectionBookingMode = computed(() => isInspectionMode(bookingMode.value))
const usesSlotSelection = computed(() => usesTimeSlotTimeline(bookingMode.value))
const bookingRate = computed(() =>
  isInspectionBookingMode.value
    ? property.value?.inspectionFee ?? 0
    : property.value?.rentPrice ?? 0,
)
const normalizedSelection = computed(() => {
  if (!property.value) return null
  try {
    return normalizeBookingSelection(form, property.value)
  } catch {
    return null
  }
})
const inspectionAvailabilityConfig = computed(() => {
  const config = createDefaultInspectionAvailabilityConfig(
    property.value?.ownerId ?? 'property-contact',
  )
  const duration = bookingModeConfig.value.defaultDurationMinutes
  const savedConfig = property.value?.availabilityConfig
  config.agents = savedConfig?.agents.length
    ? savedConfig.agents.map((agent) => ({
        ...agent,
        unavailableDates: [...new Set([...agent.unavailableDates, ...savedConfig.blockedDates])],
      }))
    : config.agents.map((agent) => ({
        ...agent,
        inspectionDurationMinutes: duration,
        maximumInspectionsPerDay: Math.max(1, Math.floor(480 / duration)),
      }))
  config.limitedRemainingCapacity = savedConfig?.limitedRemainingCapacity ?? 3
  return config
})
const propertyAddress = computed(() => {
  if (!property.value) {
    return ''
  }

  return [property.value.address, property.value.area, property.value.city, property.value.state]
    .filter(Boolean)
    .join(', ')
})
const propertyContactRole = computed(() => {
  const role = property.value?.ownerRole
  return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : 'Not provided'
})
const paymentRoute = computed(() =>
  property.value ? `/payment/${property.value.id}?type=inspection_fee` : '/payment',
)
const bookingNavigationItems = computed(() => [
  { label: 'Home', to: '/home', icon: homeOutline, matchers: ['/home'] },
  { label: 'Listings', to: '/properties', icon: gridOutline, matchers: ['/properties'] },
  ...(canManageProperties.value
    ? [
        {
          label: 'Add property',
          to: '/add-property',
          icon: addCircleOutline,
          matchers: ['/add-property'],
        },
      ]
    : []),
  {
    label: 'My bookings',
    to: '/my-bookings',
    icon: calendarClearOutline,
    matchers: ['/my-bookings'],
  },
  {
    label: 'Booking',
    to: route.fullPath,
    icon: calendarOutline,
    matchers: ['/booking'],
  },
  { label: 'Payments', to: paymentRoute.value, icon: cardOutline, matchers: ['/payment'] },
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
const profileInitial = computed(() =>
  (state.profile?.fullName || state.profile?.email || 'R').trim().charAt(0).toUpperCase(),
)
const profileRoleLabel = computed(() => {
  const role = state.profile?.role
  return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : 'Signed-in account'
})

const formattedInspectionDate = computed(() => {
  if (!form.inspectionDate) {
    return ''
  }

  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseIsoDate(form.inspectionDate))
})

const formattedInspectionTime = computed(() =>
  form.inspectionTime ? formatTimeLabel(form.inspectionTime) : '',
)

const selectedDateAvailability = computed(() =>
  form.inspectionDate
    ? calculateInspectionDateAvailability(
        form.inspectionDate,
        inspectionAvailabilityConfig.value,
        knownPropertyBookings.value,
      )
    : null,
)

const displayedMonthLabel = computed(() =>
  new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' }).format(displayedMonth.value),
)

const canGoToPreviousMonth = computed(
  () => displayedMonth.value.getTime() > startOfMonth(today).getTime(),
)

const calendarDays = computed<CalendarCell[]>(() => {
  const year = displayedMonth.value.getFullYear()
  const month = displayedMonth.value.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const cells: CalendarCell[] = []

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      day: null,
      iso: '',
      disabled: true,
      isToday: false,
      ariaLabel: '',
      availabilityState: 'disabled',
      availabilityLabel: 'Unavailable',
      availabilityDescription: '',
    })
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day)
    const iso = formatIsoDate(date)
    const availability = calculateInspectionDateAvailability(
      iso,
      inspectionAvailabilityConfig.value,
      knownPropertyBookings.value,
    )
    cells.push({
      key: iso,
      day,
      iso,
      disabled: !availability.selectable,
      isToday: iso === todayIso,
      ariaLabel: new Intl.DateTimeFormat('en-NG', { dateStyle: 'full' }).format(date),
      availabilityState: availability.state,
      availabilityLabel: availability.label,
      availabilityDescription: availability.description,
    })
  }

  while (cells.length % 7 !== 0) {
    const index = cells.length
    cells.push({
      key: `empty-end-${index}`,
      day: null,
      iso: '',
      disabled: true,
      isToday: false,
      ariaLabel: '',
      availabilityState: 'disabled',
      availabilityLabel: 'Unavailable',
      availabilityDescription: '',
    })
  }

  return cells
})

const timeSlots = computed(() => {
  return selectedDateAvailability.value?.availableSlots ?? []
})

const paymentStatusMessage = computed(() => {
  if (!isInspectionBookingMode.value) {
    return 'Payment becomes available after this reservation is created.'
  }
  if (!latestInspectionPayment.value) {
    return 'No inspection payment yet. The booking will be created with pending payment status.'
  }

  if (latestInspectionPayment.value.status === 'success') {
    return 'Inspection fee paid successfully. Your booking will carry a paid payment status.'
  }

  if (latestInspectionPayment.value.status === 'failed') {
    return 'The latest inspection payment failed. Payment will remain failed until you try again.'
  }

  return 'An inspection payment reference exists and is awaiting verification.'
})

const paymentBadgeLabel = computed(() => {
  const status = latestInspectionPayment.value?.status
  if (status === 'success') return 'Paid'
  if (status === 'failed') return 'Failed'
  return 'Pending'
})
const paymentBadgeClass = computed(() => {
  const status = latestInspectionPayment.value?.status
  if (status === 'success') return 'payment-badge--paid'
  if (status === 'failed') return 'payment-badge--failed'
  return 'payment-badge--pending'
})
const paymentBadgeIcon = computed(() =>
  latestInspectionPayment.value?.status === 'success'
    ? checkmarkCircleOutline
    : alertCircleOutline,
)
const paymentHeading = computed(() =>
  latestInspectionPayment.value?.status === 'success'
    ? 'Payment complete'
    : isInspectionBookingMode.value
      ? 'Payment required'
      : 'Available after booking',
)
const paymentActionLabel = computed(() => {
  const status = latestInspectionPayment.value?.status
  if (status === 'success') return 'View payment details'
  if (status === 'pending' || status === 'failed') return 'Manage payment'
  return 'Pay inspection fee'
})

watch(
  () => state.profile,
  (profile) => {
    if (profile) {
      form.guestPhone = form.guestPhone || profile.phone
    }
  },
  { immediate: true },
)

watch(
  [propertyId, () => state.profile?.uid],
  async ([currentPropertyId, userId]) => {
    knownPropertyBookings.value = []
    property.value = currentPropertyId ? await findById(currentPropertyId) : null
    latestInspectionPayment.value =
      currentPropertyId && userId && isInspectionBookingMode.value
        ? await findLatestPaymentForUserProperty(userId, currentPropertyId, 'inspection_fee')
        : null
    await refreshKnownAvailability()
  },
  { immediate: true },
)

watch(
  () => form.inspectionDate,
  () => {
    const selectedSlot = timeSlots.value.find((slot) => slot.value === form.inspectionTime)
    if (form.inspectionTime && !selectedSlot?.available) {
      form.inspectionTime = ''
    }
  },
)

watch(
  () => form.inspectionDate,
  (startDate) => {
    if (
      bookingModeConfig.value.selectionKind === 'date_time_range'
      && startDate
      && (!form.endDate || form.endDate < startDate)
    ) {
      form.endDate = startDate
    }
  },
)

watch(knownPropertyBookings, () => {
  const selectedSlot = timeSlots.value.find((slot) => slot.value === form.inspectionTime)
  if (form.inspectionTime && !selectedSlot?.available) {
    form.inspectionTime = ''
    calendarFeedback.value =
      'That time is no longer available. The available inspection slots have been refreshed.'
  }
})

onMounted(() => document.addEventListener('pointerdown', handleDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleDocumentPointerDown))

function isBookingNavActive(matchers: string[]) {
  return matchers.some(
    (matcher) => route.path === matcher || route.path.startsWith(`${matcher}/`),
  )
}

function openCalendar() {
  calendarSelection.value = form.inspectionDate
  calendarFeedback.value = ''
  displayedMonth.value = startOfMonth(
    form.inspectionDate ? parseIsoDate(form.inspectionDate) : today,
  )
  isCalendarOpen.value = !isCalendarOpen.value
  isTimePickerOpen.value = false
  void refreshKnownAvailability()
}

function shiftCalendarMonth(offset: number) {
  const nextMonth = new Date(
    displayedMonth.value.getFullYear(),
    displayedMonth.value.getMonth() + offset,
    1,
  )
  if (nextMonth.getTime() >= startOfMonth(today).getTime()) {
    displayedMonth.value = nextMonth
  }
}

function clearDateSelection() {
  calendarSelection.value = ''
  form.inspectionDate = ''
  form.inspectionTime = ''
  calendarFeedback.value = ''
}

function selectToday() {
  displayedMonth.value = startOfMonth(today)
  selectCalendarDate(todayIso)
}

async function applyCalendarSelection() {
  if (!calendarSelection.value) {
    return
  }

  const availability = getAvailabilityForDate(calendarSelection.value)
  if (!availability.selectable) {
    showUnavailableDateMessage()
    return
  }

  form.inspectionDate = calendarSelection.value
  const selectedSlot = availability.availableSlots.find(
    (slot) => slot.value === form.inspectionTime,
  )
  if (form.inspectionTime && !selectedSlot?.available) {
    form.inspectionTime = ''
  }
  isCalendarOpen.value = false
  await nextTick()
  isTimePickerOpen.value = true
}

function selectCalendarCell(cell: CalendarCell) {
  if (!cell.iso) {
    return
  }

  selectCalendarDate(cell.iso)
}

function selectCalendarDate(iso: string) {
  const availability = getAvailabilityForDate(iso)
  if (!availability.selectable) {
    showUnavailableDateMessage()
    return
  }

  calendarFeedback.value = ''
  calendarSelection.value = iso
}

function showUnavailableDateMessage() {
  calendarFeedback.value =
    'No inspection slots are available on this date. Please choose another available day.'
}

async function handleCalendarDayKeydown(event: KeyboardEvent, iso: string) {
  const offsetMap: Record<string, number> = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -7,
    ArrowDown: 7,
  }
  const offset = offsetMap[event.key]
  if (!offset) {
    return
  }

  event.preventDefault()
  const nextDate = parseIsoDate(iso)
  nextDate.setDate(nextDate.getDate() + offset)
  if (nextDate.getTime() < today.getTime()) {
    return
  }

  const nextIso = formatIsoDate(nextDate)
  displayedMonth.value = startOfMonth(nextDate)
  if (getAvailabilityForDate(nextIso).selectable) {
    calendarSelection.value = nextIso
    calendarFeedback.value = ''
  }
  await nextTick()
  datePickerRoot.value
    ?.querySelector<HTMLButtonElement>(`[data-calendar-date="${nextIso}"]`)
    ?.focus()
}

function openTimePicker() {
  isTimePickerOpen.value = !isTimePickerOpen.value
  isCalendarOpen.value = false
}

function selectTimeSlot(value: string) {
  const slot = timeSlots.value.find((item) => item.value === value)
  if (!slot?.available) {
    calendarFeedback.value =
      'That inspection time is unavailable. Please choose one of the available slots.'
    return
  }

  form.inspectionTime = value
  calendarFeedback.value = ''
  isTimePickerOpen.value = false
}

function clearTimeSelection() {
  form.inspectionTime = ''
  isTimePickerOpen.value = false
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (isCalendarOpen.value && !datePickerRoot.value?.contains(target)) {
    isCalendarOpen.value = false
  }
  if (isTimePickerOpen.value && !timePickerRoot.value?.contains(target)) {
    isTimePickerOpen.value = false
  }
}

function getAvailabilityForDate(dateIso: string) {
  return calculateInspectionDateAvailability(
    dateIso,
    inspectionAvailabilityConfig.value,
    knownPropertyBookings.value,
  )
}

async function refreshKnownAvailability(force = false) {
  const userId = state.profile?.uid
  const currentPropertyId = property.value?.id

  if (!userId || !currentPropertyId) {
    knownPropertyBookings.value = []
    return
  }

  isRefreshingAvailability.value = true
  availabilityLoadError.value = ''

  try {
    knownPropertyBookings.value = await loadKnownPropertyInspectionBookings(
      userId,
      currentPropertyId,
      { force },
    )
  } catch (error) {
    availabilityLoadError.value =
      error instanceof Error
        ? error.message
        : 'Live availability could not be refreshed right now.'
  } finally {
    isRefreshingAvailability.value = false
  }
}

async function handleSubmit() {
  if (!state.profile) {
    messageTone.value = 'error'
    message.value = 'Sign in before creating a booking.'
    return
  }

  if (!property.value) {
    messageTone.value = 'error'
    message.value = 'Open the booking page from a property before saving a booking.'
    return
  }

  message.value = ''

  try {
    if (usesSlotSelection.value && form.inspectionDate) {
      await refreshKnownAvailability(true)
      const availability = getAvailabilityForDate(form.inspectionDate)

      if (!availability.selectable) {
        messageTone.value = 'error'
        message.value =
            'No booking slots are available on this date. Please choose another available day.'
        return
      }

      if (form.inspectionTime) {
        const selectedSlot = availability.availableSlots.find(
          (slot) => slot.value === form.inspectionTime,
        )
        if (!selectedSlot?.available) {
          form.inspectionTime = ''
          messageTone.value = 'error'
          message.value =
            'That time is no longer available. Please choose another available slot.'
          return
        }
      }
    }

    if (!usesSlotSelection.value) {
      await refreshKnownAvailability(true)
      if (findBookingConflict(form, property.value, knownPropertyBookings.value)) {
        messageTone.value = 'error'
        message.value = 'This time is no longer available. Please select another option.'
        return
      }
    }

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
        ? `Booking created with successful payment status.${notificationNotice}`
        : `Booking created successfully. Payment is currently pending.${notificationNotice}`
    await router.replace('/my-bookings?notice=booking-created')
  } catch (error) {
    messageTone.value = 'error'
    message.value = error instanceof Error ? error.message : 'Could not create the booking.'
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatIsoDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatTimeLabel(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}
</script>

<style scoped>
.booking-page-layout {
  min-height: 100%;
  background: #f6f7f9;
}

.booking-desktop-nav {
  display: none;
}

.booking-main-content {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 16px;
}

.booking-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #102033;
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 20px;
  letter-spacing: 0;
}

.booking-brand span {
  color: #1f6fe7;
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
}

.booking-brand strong {
  font-weight: 800;
}

.booking-nav-links {
  display: grid;
  gap: 5px;
  margin-top: 34px;
}

.booking-nav-link {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 13px;
  border-radius: 11px;
  padding: 0 13px;
  color: #344256;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 200ms ease, background-color 200ms ease, color 200ms ease,
    box-shadow 200ms ease;
}

.booking-nav-link ion-icon {
  flex: 0 0 auto;
  font-size: 18px;
}

.booking-nav-link:hover {
  transform: translateX(2px);
  background: #edf5ff;
  color: #1858c8;
}

.booking-nav-link--active,
.booking-nav-link--active:hover {
  background: #1f6fe7;
  color: #ffffff;
  box-shadow: 0 14px 28px -18px rgba(31, 111, 231, 0.85);
}

.booking-profile-card {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  border: 1px solid #e0e6ed;
  border-radius: 14px;
  background: #f8fafc;
  padding: 11px;
  color: #344256;
  text-decoration: none;
  transition: border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease;
}

.booking-profile-card:hover {
  transform: translateY(-2px);
  border-color: #b8d8ff;
  box-shadow: 0 14px 30px -24px rgba(16, 32, 51, 0.6);
}

.booking-profile-card > img,
.booking-profile-avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 50%;
  object-fit: cover;
}

.booking-profile-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #1f6fe7;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
}

.booking-profile-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.booking-profile-copy strong,
.booking-profile-copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booking-profile-copy strong {
  color: #102033;
  font-size: 11px;
}

.booking-profile-copy small {
  margin-top: 2px;
  color: #7b899a;
  font-size: 9px;
}

.booking-profile-card > ion-icon {
  flex: 0 0 auto;
  color: #8a98aa;
  font-size: 14px;
}

.booking-hero {
  display: grid;
  height: 152px;
  grid-template-columns: minmax(0, 1.12fr) minmax(360px, 0.88fr);
  overflow: hidden;
  border: 1px solid rgba(218, 225, 235, 0.92);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 22px 52px -36px rgba(16, 32, 51, 0.55);
}

.booking-hero-copy {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 26px;
}

.booking-hero-icon {
  display: inline-flex;
  width: 50px;
  height: 50px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  background: #eaf3ff;
  color: #1f6fe7;
  font-size: 24px;
}

.booking-eyebrow {
  margin: 0;
  color: #1f6fe7;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.4;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.booking-hero h1 {
  margin: 6px 0 0;
  color: #102033;
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0;
}

.booking-hero-copy > div > p:last-child {
  max-width: 620px;
  margin: 8px 0 0;
  color: #68778a;
  font-size: 14px;
  line-height: 1.45;
}

.booking-hero-media,
.property-summary-image {
  position: relative;
  overflow: hidden;
  background: #e9edf2;
}

.booking-hero-media::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(16, 32, 51, 0.12), transparent 42%);
  content: '';
  pointer-events: none;
}

.booking-hero-media img,
.property-summary-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.booking-image-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 150px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #edf2f7;
  color: #718096;
  font-size: 12px;
  font-weight: 700;
}

.booking-image-placeholder ion-icon {
  font-size: 30px;
}

.booking-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: start;
  gap: 24px;
  margin-top: 24px;
}

.booking-card {
  border: 1px solid rgba(218, 225, 235, 0.92);
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 20px 48px -38px rgba(16, 32, 51, 0.55);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.booking-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 26px 54px -36px rgba(16, 32, 51, 0.6);
}

.booking-form-card {
  padding: 28px;
}

.booking-section-heading,
.summary-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.booking-section-heading h2,
.summary-card-heading h2,
.property-summary-content h2 {
  margin: 6px 0 0;
  color: #102033;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
  letter-spacing: 0;
}

.secure-chip {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: #eaf8f2;
  padding: 7px 10px;
  color: #087c52;
  font-size: 11px;
  font-weight: 800;
}

.booking-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px;
  border: 1px solid;
  border-radius: 14px;
  padding: 13px 14px;
  font-size: 13px;
  line-height: 1.55;
}

.booking-message ion-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  font-size: 18px;
}

.booking-message--success {
  border-color: #bce8d4;
  background: #effaf5;
  color: #087c52;
}

.booking-message--error {
  border-color: #fecdd3;
  background: #fff1f2;
  color: #be123c;
}

.booking-form {
  margin-top: 26px;
}

.booking-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.booking-field {
  min-width: 0;
}

.booking-field--wide {
  grid-column: 1 / -1;
}

.booking-field > label {
  display: block;
  margin-bottom: 9px;
  color: #344256;
  font-size: 12px;
  font-weight: 800;
}

.booking-popover-field {
  position: relative;
  z-index: 4;
}

.booking-popover-field:focus-within {
  z-index: 20;
}

.booking-input {
  width: 100%;
  min-height: 50px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #ffffff;
  color: #102033;
  font-size: 13px;
  outline: none;
  transition: border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease;
}

.booking-input:hover {
  border-color: #b8c6d8;
}

.booking-input:focus,
.booking-input:focus-within {
  border-color: #5ea6ff;
  box-shadow: 0 0 0 4px rgba(50, 143, 255, 0.12);
}

.booking-picker-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  text-align: left;
}

.booking-picker-trigger:disabled {
  background: #f6f7f9;
  color: #9aa6b5;
  cursor: not-allowed;
}

.booking-picker-trigger > ion-icon:first-child {
  flex: 0 0 auto;
  color: #1f6fe7;
  font-size: 18px;
}

.booking-picker-trigger span {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.booking-placeholder {
  color: #8a98aa;
}

.picker-chevron {
  flex: 0 0 auto;
  color: #718096;
}

.booking-text-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
}

.booking-native-input {
  padding: 0 14px;
}

.booking-text-input ion-icon {
  flex: 0 0 auto;
  color: #1f6fe7;
  font-size: 18px;
}

.booking-text-input input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: #102033;
  font: inherit;
  outline: 0;
}

.booking-text-input input::placeholder,
.booking-textarea::placeholder {
  color: #8a98aa;
}

.booking-textarea {
  display: block;
  min-height: 112px;
  resize: vertical;
  padding: 13px 14px;
  line-height: 1.6;
}

.field-hint {
  margin: 7px 0 0;
  color: #7b899a;
  font-size: 11px;
  line-height: 1.5;
}

.calendar-popover,
.time-popover {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 80;
  width: min(360px, calc(100vw - 48px));
  overflow: hidden;
  border: 1px solid #dfe5ec;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 24px 60px -24px rgba(16, 32, 51, 0.45);
}

.calendar-header,
.time-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
}

.calendar-header h3,
.time-popover-header h3 {
  margin: 0;
  color: #102033;
  font-size: 14px;
  font-weight: 800;
}

.calendar-nav-button {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #344256;
  transition: background-color 180ms ease, color 180ms ease;
}

.calendar-nav-button:hover:not(:disabled) {
  background: #edf5ff;
  color: #1f6fe7;
}

.calendar-nav-button:disabled {
  color: #c2cad5;
  cursor: not-allowed;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
  padding: 0 14px;
}

.calendar-weekdays {
  margin-bottom: 5px;
}

.calendar-weekdays span {
  color: #8a98aa;
  font-size: 9px;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
}

.calendar-day,
.calendar-empty {
  width: 100%;
  aspect-ratio: 1;
}

.calendar-day {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 10px;
  color: #344256;
  font-size: 12px;
  font-weight: 700;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.calendar-day:hover:not(.calendar-day--disabled) {
  transform: translateY(-1px);
  background: #edf5ff;
  color: #1858c8;
}

.calendar-day--today {
  box-shadow: inset 0 0 0 1px #93c7ff;
  color: #1858c8;
}

.calendar-availability-dot {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #aeb8c5;
}

.calendar-day--available .calendar-availability-dot {
  background: #16a36d;
}

.calendar-day--limited .calendar-availability-dot {
  background: #e0a000;
}

.calendar-day--fully_booked .calendar-availability-dot {
  background: #dc4c64;
}

.calendar-day--disabled .calendar-availability-dot {
  background: #aeb8c5;
}

.calendar-day--selected,
.calendar-day--selected:hover:not(.calendar-day--disabled) {
  background: #1f6fe7;
  color: #ffffff;
  box-shadow: none;
}

.calendar-day--selected .calendar-availability-dot {
  background: #ffffff;
}

.calendar-day--disabled {
  color: #c4ccd6;
  cursor: not-allowed;
}

.calendar-day--disabled:hover {
  transform: none;
  background: transparent;
}

.calendar-legend {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px 12px;
  margin-top: 11px;
  padding: 0 14px;
}

.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #68778a;
  font-size: 9px;
  font-weight: 700;
}

.legend-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #aeb8c5;
}

.legend-dot--available {
  background: #16a36d;
}

.legend-dot--limited {
  background: #e0a000;
}

.legend-dot--full {
  background: #dc4c64;
}

.calendar-feedback,
.calendar-refresh-note {
  margin: 10px 14px 0;
  border-radius: 10px;
  background: #fff7df;
  padding: 8px 10px;
  color: #865b00;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.45;
}

.calendar-refresh-note {
  background: #edf5ff;
  color: #1858c8;
}

.calendar-refresh-note--error {
  background: #fff1f2;
  color: #be123c;
}

.calendar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  border-top: 1px solid #edf0f4;
  padding: 12px 14px;
}

.calendar-text-button,
.calendar-apply-button {
  min-height: 34px;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 800;
}

.calendar-text-button {
  color: #536277;
}

.calendar-text-button:hover {
  background: #f1f4f7;
}

.calendar-apply-button {
  margin-left: auto;
  background: #1f6fe7;
  color: #ffffff;
}

.calendar-apply-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.time-popover {
  right: 0;
  left: auto;
}

.time-popover-header {
  border-bottom: 1px solid #edf0f4;
}

.time-popover-header p {
  margin: 3px 0 0;
  color: #7b899a;
  font-size: 10px;
}

.time-popover-header button {
  border-radius: 9px;
  padding: 7px 9px;
  color: #536277;
  font-size: 10px;
  font-weight: 800;
}

.time-popover-header button:hover {
  background: #f1f4f7;
}

.time-slot-grid {
  display: grid;
  max-height: 246px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  overflow-y: auto;
  padding: 12px;
}

.time-slot {
  min-height: 38px;
  border: 1px solid #e2e7ed;
  border-radius: 10px;
  color: #344256;
  font-size: 10px;
  font-weight: 800;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease;
}

.time-slot:hover:not(:disabled) {
  border-color: #b8d8ff;
  background: #edf5ff;
  color: #1858c8;
}

.time-slot--selected,
.time-slot--selected:hover:not(:disabled) {
  border-color: #1f6fe7;
  background: #1f6fe7;
  color: #ffffff;
}

.time-slot:disabled {
  border-color: #edf0f3;
  background: #f6f7f9;
  color: #b1bbc7;
  cursor: not-allowed;
}

.booking-popover-enter-active,
.booking-popover-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
  transform-origin: top center;
}

.booking-popover-enter-from,
.booking-popover-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.985);
}

.booking-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 11px;
  margin-top: 26px;
}

.booking-button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 20px;
  border-radius: 13px;
  padding: 0 20px;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  text-decoration: none;
  transition: transform 200ms ease, border-color 200ms ease, background-color 200ms ease,
    box-shadow 200ms ease, color 200ms ease;
}

.booking-button:hover:not(:disabled) {
  transform: translateY(-3px);
}

.booking-button--secondary {
  border: 1px solid #d6dde6;
  background: #ffffff;
  color: #344256;
}

.booking-button--secondary:hover {
  border-color: #93c7ff;
  color: #1858c8;
}

.booking-button--primary {
  min-width: 182px;
  background: #1f6fe7;
  color: #ffffff;
  box-shadow: 0 14px 28px -16px rgba(31, 111, 231, 0.8);
}

.booking-button--primary:hover:not(:disabled) {
  background: #1858c8;
  box-shadow: 0 18px 32px -16px rgba(31, 111, 231, 0.9);
}

.booking-button:disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.booking-spinner {
  animation: booking-spin 800ms linear infinite;
}

.booking-sidebar {
  display: grid;
  gap: 16px;
}

.booking-trust-strip {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 18px;
  border: 1px solid #dce6f4;
  border-radius: 16px;
  background: #f1f6fc;
  padding: 14px 18px;
}

.booking-trust-strip > span {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #ffffff;
  color: #1f6fe7;
  font-size: 19px;
}

.booking-trust-strip strong {
  display: block;
  color: #102033;
  font-size: 11px;
}

.booking-trust-strip p {
  margin: 3px 0 0;
  color: #718096;
  font-size: 9px;
  line-height: 1.45;
}

.property-summary-card {
  overflow: hidden;
}

.property-summary-image {
  aspect-ratio: 16 / 8;
}

.property-summary-content,
.inspection-summary-card,
.payment-card,
.reminder-card {
  padding: 22px;
}

.summary-status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  border-radius: 999px;
  padding: 7px 9px;
  font-size: 9px;
  font-weight: 800;
}

.summary-status--pending {
  background: #f1f4f7;
  color: #68778a;
}

.summary-status--ready {
  background: #eaf8f2;
  color: #087c52;
}

.summary-status--unavailable {
  background: #fff1f2;
  color: #be123c;
}

.inspection-summary-list {
  display: grid;
  gap: 10px;
  margin: 18px 0 0;
}

.inspection-summary-list div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid #edf0f4;
  padding-top: 10px;
}

.inspection-summary-list dt {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #718096;
  font-size: 10px;
}

.inspection-summary-list dt ion-icon {
  color: #1f6fe7;
  font-size: 13px;
}

.inspection-summary-list dd {
  max-width: 58%;
  margin: 0;
  overflow-wrap: anywhere;
  color: #102033;
  font-size: 10px;
  font-weight: 800;
  text-align: right;
}

.property-address {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 10px 0 0;
  color: #68778a;
  font-size: 12px;
  line-height: 1.55;
}

.property-address ion-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #1f6fe7;
  font-size: 15px;
}

.property-facts {
  display: grid;
  gap: 11px;
  margin: 18px 0 0;
}

.property-facts div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid #edf0f4;
  padding-top: 11px;
}

.property-facts dt {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #718096;
  font-size: 11px;
}

.property-facts dt ion-icon {
  color: #1f6fe7;
  font-size: 14px;
}

.property-facts dd {
  margin: 0;
  color: #102033;
  font-size: 11px;
  font-weight: 800;
  text-align: right;
}

.empty-copy,
.payment-copy {
  margin: 13px 0 0;
  color: #68778a;
  font-size: 12px;
  line-height: 1.65;
}

.payment-badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 7px 9px;
  font-size: 10px;
  font-weight: 800;
}

.payment-badge--paid {
  background: #eaf8f2;
  color: #087c52;
}

.payment-badge--pending {
  background: #fff7df;
  color: #9a6700;
}

.payment-badge--failed {
  background: #fff1f2;
  color: #be123c;
}

.payment-amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  border-radius: 14px;
  background: #f5f8fc;
  padding: 14px;
}

.payment-amount-row span,
.payment-reference span {
  display: block;
  color: #7b899a;
  font-size: 10px;
  font-weight: 700;
}

.payment-amount-row strong {
  display: block;
  margin-top: 4px;
  color: #102033;
  font-size: 17px;
}

.payment-amount-row > ion-icon {
  color: #1f6fe7;
  font-size: 24px;
}

.payment-reference {
  margin-top: 13px;
  border-bottom: 1px solid #edf0f4;
  padding-bottom: 13px;
}

.payment-reference strong {
  display: block;
  overflow-wrap: anywhere;
  margin-top: 4px;
  color: #344256;
  font-size: 11px;
}

.payment-link {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 15px;
  border-radius: 12px;
  background: #102033;
  padding: 0 14px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 200ms ease, background-color 200ms ease;
}

.payment-link:hover {
  transform: translateY(-2px);
  background: #1d3048;
}

.reminder-icon {
  display: inline-flex;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #edf5ff;
  color: #1f6fe7;
  font-size: 18px;
}

.reminder-list {
  display: grid;
  gap: 12px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.reminder-list li {
  display: flex;
  align-items: center;
  gap: 11px;
}

.reminder-list li > ion-icon {
  flex: 0 0 auto;
  color: #1f6fe7;
  font-size: 17px;
}

.reminder-list strong,
.reminder-list span {
  display: block;
}

.reminder-list strong {
  color: #344256;
  font-size: 11px;
}

.reminder-list span {
  margin-top: 2px;
  color: #7b899a;
  font-size: 10px;
  line-height: 1.4;
}

.booking-button:focus-visible,
.booking-nav-link:focus-visible,
.booking-profile-card:focus-visible,
.booking-picker-trigger:focus-visible,
.calendar-nav-button:focus-visible,
.calendar-day:focus-visible,
.calendar-text-button:focus-visible,
.calendar-apply-button:focus-visible,
.time-slot:focus-visible,
.time-popover-header button:focus-visible,
.payment-link:focus-visible {
  outline: 3px solid rgba(50, 143, 255, 0.3);
  outline-offset: 2px;
}

@keyframes booking-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 640px) {
  .booking-main-content {
    padding: 24px;
  }
}

@media (min-width: 1024px) {
  .booking-page-layout {
    display: grid;
    grid-template-columns: 224px minmax(0, 1fr);
  }

  .booking-desktop-nav {
    position: sticky;
    top: 0;
    display: flex;
    height: 100vh;
    align-self: start;
    flex-direction: column;
    border-right: 1px solid #e3e8ee;
    background: #ffffff;
    padding: 28px 18px 22px;
  }

  .booking-main-content {
    min-width: 0;
    padding: 24px 26px 28px;
  }

  .booking-hero {
    height: 148px;
  }

  .booking-hero-copy {
    padding: 10px 22px;
  }

  :deep(nav[aria-label='Primary navigation']) {
    display: none;
  }
}

@media (min-width: 1280px) {
  .property-summary-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 210px;
  }

  .property-summary-image {
    order: 2;
    aspect-ratio: auto;
    margin: 18px 18px 18px 0;
    border-radius: 15px;
  }

  .property-summary-content {
    order: 1;
  }
}

@media (min-width: 1440px) {
  .booking-page-layout {
    grid-template-columns: 250px minmax(0, 1fr);
  }

  .booking-desktop-nav {
    padding-right: 22px;
    padding-left: 22px;
  }

  .booking-main-content {
    padding-right: 30px;
    padding-left: 30px;
  }
}

@media (max-width: 1279px) {
  .booking-hero {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
  }

  .booking-hero-copy {
    gap: 14px;
    padding: 10px 22px;
  }

  .booking-hero-icon {
    width: 48px;
    height: 48px;
  }

  .booking-hero h1 {
    font-size: 26px;
  }

  .booking-hero-copy > div > p:last-child {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.35;
  }

  .booking-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .booking-sidebar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .property-summary-card {
    grid-row: span 2;
  }
}

@media (max-width: 767px) {
  .booking-hero {
    height: auto;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
  }

  .booking-hero-copy {
    padding: 20px;
  }

  .booking-hero-media {
    aspect-ratio: 16 / 7;
  }

  .booking-fields-grid,
  .booking-sidebar {
    grid-template-columns: minmax(0, 1fr);
  }

  .property-summary-card {
    grid-row: auto;
  }
}

@media (max-width: 639px) {
  .booking-hero-copy {
    align-items: flex-start;
    gap: 14px;
    padding: 20px;
  }

  .booking-hero-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    font-size: 22px;
  }

  .booking-hero h1 {
    font-size: 26px;
  }

  .booking-hero-copy > div > p:last-child {
    font-size: 12px;
  }

  .booking-layout {
    gap: 16px;
    margin-top: 16px;
  }

  .booking-form-card {
    padding: 20px 16px;
  }

  .booking-section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .booking-fields-grid {
    gap: 16px;
  }

  .calendar-popover,
  .time-popover {
    right: 0;
    left: 0;
    width: 100%;
  }

  .time-slot-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .booking-actions {
    position: sticky;
    bottom: 88px;
    z-index: 30;
    align-items: stretch;
    flex-direction: column-reverse;
    margin: 24px -8px -12px;
    border: 1px solid rgba(218, 225, 235, 0.88);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.92);
    padding: 8px;
    box-shadow: 0 18px 44px -28px rgba(16, 32, 51, 0.58);
    backdrop-filter: blur(16px);
  }

  .booking-button {
    width: 100%;
  }

  .booking-button--primary {
    min-width: 0;
  }

  .property-summary-content,
  .inspection-summary-card,
  .payment-card,
  .reminder-card {
    padding: 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .booking-card,
  .booking-button,
  .payment-link,
  .calendar-day,
  .calendar-nav-button,
  .time-slot,
  .booking-input,
  .booking-popover-enter-active,
  .booking-popover-leave-active {
    animation: none;
    transition: none;
  }
}
</style>
