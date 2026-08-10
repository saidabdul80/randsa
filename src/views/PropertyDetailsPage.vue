<template>
  <AppShell :show-header="false" :show-bottom-nav="false" content-class="min-h-full w-full">
    <div class="property-details-page">
      <div class="property-details-layout">
        <div class="property-details-sidebar">
          <NotificationSidebarNav
            :can-manage-properties="canManageProperties"
            aria-label="Property details navigation"
            :show-mobile="false"
          />
        </div>

        <main class="property-details-main">
          <div
            v-if="loadState === 'loading'"
            class="property-details-skeleton"
            aria-label="Loading property details"
          >
            <div class="property-details-skeleton__header" />
            <div class="property-details-skeleton__columns">
              <div>
                <div class="property-details-skeleton__gallery" />
                <div v-for="index in 4" :key="index" class="property-details-skeleton__card" />
              </div>
              <div>
                <div class="property-details-skeleton__panel" />
                <div class="property-details-skeleton__panel is-short" />
              </div>
            </div>
          </div>

          <section
            v-else-if="loadState === 'error' || loadState === 'not-found'"
            class="property-state-card"
          >
            <span aria-hidden="true"><IonIcon :icon="homeOutline" /></span>
            <p>
              {{ loadState === 'not-found' ? 'Listing unavailable' : 'Unable to load listing' }}
            </p>
            <h1>
              {{
                loadState === 'not-found'
                  ? 'This property could not be found.'
                  : 'Property details are temporarily unavailable.'
              }}
            </h1>
            <small>
              {{
                loadState === 'not-found'
                  ? 'The listing may have been removed or the address may be incorrect.'
                  : 'Check your connection and try loading this listing again.'
              }}
            </small>
            <div>
              <button v-if="loadState === 'error'" type="button" @click="retryPropertyLoad">
                <IonIcon :icon="refreshOutline" aria-hidden="true" />
                Try again
              </button>
              <RouterLink to="/properties">
                <IonIcon :icon="searchOutline" aria-hidden="true" />
                Back to Explore
              </RouterLink>
            </div>
          </section>

          <template v-else-if="property">
            <header class="property-details-header">
              <div class="property-details-header__navigation">
                <button type="button" aria-label="Go back" @click="goBack">
                  <IonIcon :icon="arrowBackOutline" aria-hidden="true" />
                </button>
                <nav aria-label="Breadcrumb">
                  <RouterLink to="/home">Home</RouterLink>
                  <span>/</span>
                  <RouterLink to="/properties">Explore</RouterLink>
                  <span>/</span>
                  <strong>Property details</strong>
                </nav>
              </div>

              <div class="property-details-header__actions">
                <button
                  type="button"
                  :aria-label="isCurrentPropertySaved ? 'Remove from saved' : 'Save property'"
                  :aria-pressed="isCurrentPropertySaved"
                  :disabled="savingPropertyId === property.id"
                  @click="handleToggleSaved(property)"
                >
                  <IonSpinner
                    v-if="savingPropertyId === property.id"
                    name="crescent"
                    aria-hidden="true"
                  />
                  <IonIcon
                    v-else
                    :icon="isCurrentPropertySaved ? heart : heartOutline"
                    aria-hidden="true"
                  />
                </button>
                <button type="button" aria-label="Share property" @click="shareProperty">
                  <IonIcon :icon="shareSocialOutline" aria-hidden="true" />
                </button>
                <details ref="moreMenuRef" class="property-details-more-menu">
                  <summary aria-label="More property actions">
                    <IonIcon :icon="ellipsisHorizontal" aria-hidden="true" />
                  </summary>
                  <div>
                    <button type="button" @click="copyCurrentLink">
                      <IonIcon :icon="copyOutline" aria-hidden="true" />
                      Copy link
                    </button>
                    <button type="button" @click="printProperty">
                      <IonIcon :icon="printOutline" aria-hidden="true" />
                      Print listing
                    </button>
                  </div>
                </details>
              </div>
            </header>

            <div class="property-details-columns">
              <article class="property-details-content">
                <PropertyMediaGallery
                  :key="property.id"
                  :images="property.images"
                  :title="property.title"
                  :is-available="property.isAvailable"
                  :availability-label="propertyAvailabilityLabel"
                />

                <section class="property-summary-card" aria-labelledby="property-title">
                  <div class="property-summary-card__heading">
                    <div>
                      <div class="property-summary-card__badges">
                        <span>{{ property.propertyType }}</span>
                        <span :class="`is-${property.status}`">{{
                          titleCase(property.status)
                        }}</span>
                        <span v-if="ownerProfile?.isVerifiedAgent" class="is-verified">
                          <IonIcon :icon="checkmarkCircle" aria-hidden="true" />
                          Verified professional
                        </span>
                      </div>
                      <h1 id="property-title">{{ property.title }}</h1>
                      <p>
                        <IonIcon :icon="locationOutline" aria-hidden="true" />
                        {{ fullAddress }}
                      </p>
                    </div>
                    <div class="property-summary-card__price">
                      <strong>{{ formatCurrency(property.rentPrice) }}</strong>
                      <span>/ {{ formatPeriod(property.paymentDuration) }}</span>
                    </div>
                  </div>

                  <div class="property-summary-card__meta">
                    <span v-if="listedDate">
                      <IonIcon :icon="calendarOutline" aria-hidden="true" />
                      Listed {{ listedDate }}
                    </span>
                    <span v-if="updatedDate">
                      <IonIcon :icon="timeOutline" aria-hidden="true" />
                      Updated {{ updatedDate }}
                    </span>
                    <button type="button" @click="handleToggleComparison(property)">
                      <IonIcon :icon="gitCompareOutline" aria-hidden="true" />
                      {{ currentPropertyIsCompared ? 'Added to compare' : 'Add to compare' }}
                    </button>
                  </div>

                  <div class="property-listing-pulse">
                    <span aria-hidden="true"><IonIcon :icon="pulseOutline" /></span>
                    <div>
                      <p>Listing pulse</p>
                      <strong>{{ listingPulse }}</strong>
                    </div>
                    <span v-if="property.status === 'approved'" class="is-trusted">
                      <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />
                      Approved listing
                    </span>
                  </div>
                </section>

                <section
                  v-if="quickFacts.length"
                  class="property-content-card"
                  aria-labelledby="property-facts-title"
                >
                  <header>
                    <div>
                      <p>At a glance</p>
                      <h2 id="property-facts-title">Property details</h2>
                    </div>
                  </header>
                  <div class="property-quick-facts">
                    <article v-for="fact in quickFacts" :key="fact.label">
                      <span aria-hidden="true"><IonIcon :icon="fact.icon" /></span>
                      <div>
                        <small>{{ fact.label }}</small>
                        <strong>{{ fact.value }}</strong>
                      </div>
                    </article>
                  </div>
                </section>

                <section class="property-content-card" aria-labelledby="property-about-title">
                  <header>
                    <div>
                      <p>Overview</p>
                      <h2 id="property-about-title">About this property</h2>
                    </div>
                  </header>
                  <p v-if="property.description" class="property-description">
                    {{ visibleDescription }}
                  </p>
                  <p v-else class="property-content-card__empty-copy">
                    A description has not been added to this listing.
                  </p>
                  <button
                    v-if="descriptionIsLong"
                    type="button"
                    class="property-description-toggle"
                    :aria-expanded="descriptionIsExpanded"
                    @click="descriptionIsExpanded = !descriptionIsExpanded"
                  >
                    {{ descriptionIsExpanded ? 'Show less' : 'Read more' }}
                    <IonIcon
                      :icon="descriptionIsExpanded ? chevronUpOutline : chevronDownOutline"
                      aria-hidden="true"
                    />
                  </button>
                </section>

                <section
                  v-if="amenityItems.length"
                  class="property-content-card"
                  aria-labelledby="property-amenities-title"
                >
                  <header>
                    <div>
                      <p>Included features</p>
                      <h2 id="property-amenities-title">Features and amenities</h2>
                    </div>
                    <button
                      v-if="amenityItems.length > 8"
                      type="button"
                      :aria-expanded="showAllAmenities"
                      @click="showAllAmenities = !showAllAmenities"
                    >
                      {{ showAllAmenities ? 'Show fewer' : `Show all ${amenityItems.length}` }}
                    </button>
                  </header>
                  <div class="property-amenities">
                    <span v-for="amenity in visibleAmenities" :key="amenity.label">
                      <IonIcon :icon="amenity.icon" aria-hidden="true" />
                      {{ amenity.label }}
                    </span>
                  </div>
                </section>

                <section
                  ref="mapSectionRef"
                  class="property-content-card property-location-card"
                  aria-labelledby="property-location-title"
                >
                  <header>
                    <div>
                      <p>Location</p>
                      <h2 id="property-location-title">Explore the area</h2>
                      <span>{{ fullAddress }}</span>
                    </div>
                    <div class="property-location-card__actions">
                      <button type="button" @click="copyAddress">
                        <IonIcon :icon="copyOutline" aria-hidden="true" />
                        Copy address
                      </button>
                      <a
                        v-if="directionsUrl"
                        :href="directionsUrl"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <IonIcon :icon="navigateOutline" aria-hidden="true" />
                        Directions
                      </a>
                    </div>
                  </header>
                  <div class="property-location-card__map">
                    <PropertyMapPreview
                      v-if="mapShouldRender"
                      :latitude="property.latitude"
                      :longitude="property.longitude"
                      :title="property.title"
                      :price-label="`${formatCurrency(property.rentPrice)} / ${formatPeriod(
                        property.paymentDuration
                      )}`"
                    />
                    <div v-else class="property-location-card__skeleton" aria-hidden="true" />
                  </div>
                </section>

                <section class="property-content-card" aria-labelledby="before-booking-title">
                  <header>
                    <div>
                      <p>Book with confidence</p>
                      <h2 id="before-booking-title">Before you book</h2>
                    </div>
                  </header>
                  <div class="property-booking-checklist">
                    <span v-for="item in beforeBookingItems" :key="item">
                      <IonIcon :icon="checkmarkCircle" aria-hidden="true" />
                      {{ item }}
                    </span>
                  </div>
                  <p class="property-booking-checklist__note">
                    <IonIcon :icon="informationCircleOutline" aria-hidden="true" />
                    Inspection is recommended before rent payment.
                  </p>
                </section>

                <SimilarProperties
                  :properties="similarProperties"
                  :current-property="property"
                  :saved-property-ids="savedPropertyIds"
                  :saving-property-id="savingPropertyId"
                  :comparison-property-ids="[...selectedPropertyIds]"
                  :comparison-is-full="comparisonIsFull"
                  @toggle-saved="handleToggleSaved"
                  @toggle-compare="handleToggleComparison"
                />
              </article>

              <div class="property-details-booking-column">
                <PropertyBookingPanel
                  :property="property"
                  :owner-profile="ownerProfile"
                  :is-saved="isCurrentPropertySaved"
                  :is-saving="savingPropertyId === property.id"
                  :can-edit="canEdit"
                  :action-message="actionMessage"
                  :message-tone="actionMessageTone"
                  :directions-url="directionsUrl"
                  :is-compared="currentPropertyIsCompared"
                  :compare-disabled="comparisonIsFull"
                  @toggle-saved="handleToggleSaved(property)"
                  @toggle-compare="handleToggleComparison(property)"
                  @share="shareProperty"
                />
              </div>
            </div>
          </template>
        </main>
      </div>
    </div>

    <template v-if="property && loadState === 'ready'">
      <div class="property-mobile-booking-bar">
        <div>
          <strong>{{ formatCurrency(property.rentPrice) }}</strong>
          <span>/ {{ formatPeriod(property.paymentDuration) }}</span>
        </div>
        <RouterLink :to="`/booking/${property.id}`">Book inspection</RouterLink>
        <button
          type="button"
          aria-label="Open more property actions"
          @click="isActionSheetOpen = true"
        >
          <IonIcon :icon="ellipsisHorizontal" aria-hidden="true" />
        </button>
      </div>

      <PropertyActionSheet
        :open="isActionSheetOpen"
        :property="property"
        :is-saved="isCurrentPropertySaved"
        :is-saving="savingPropertyId === property.id"
        :can-edit="canEdit"
        :directions-url="directionsUrl"
        :is-compared="currentPropertyIsCompared"
        :compare-disabled="comparisonIsFull"
        :comparison-count="comparisonCount"
        @close="isActionSheetOpen = false"
        @toggle-saved="handleToggleSaved(property)"
        @toggle-compare="handleToggleComparison(property)"
        @open-comparison="openComparisonFromSheet"
        @share="shareProperty"
      />

      <PropertyComparisonTray
        ref="comparisonTrayRef"
        :properties="comparisonProperties"
        :saved-property-ids="savedPropertyIds"
        :saving-property-id="savingPropertyId"
        @remove="removeComparisonProperty"
        @clear="clearComparison"
        @toggle-saved="handleToggleSaved"
      />

      <Transition name="property-toast">
        <div
          v-if="actionMessage"
          class="property-mobile-toast"
          :class="`is-${actionMessageTone}`"
          role="status"
          aria-live="polite"
        >
          {{ actionMessage }}
        </div>
      </Transition>
    </template>

    <div class="property-details-mobile-nav"><AppBottomNav /></div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  arrowBackOutline,
  bedOutline,
  calendarOutline,
  carOutline,
  checkmarkCircle,
  chevronDownOutline,
  chevronUpOutline,
  copyOutline,
  ellipsisHorizontal,
  flashOutline,
  gitCompareOutline,
  heart,
  heartOutline,
  homeOutline,
  informationCircleOutline,
  keyOutline,
  locationOutline,
  navigateOutline,
  printOutline,
  pulseOutline,
  refreshOutline,
  resizeOutline,
  restaurantOutline,
  searchOutline,
  shareSocialOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  storefrontOutline,
  timeOutline,
  waterOutline,
} from 'ionicons/icons'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import AppBottomNav from '../components/navigation/AppBottomNav.vue'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import PropertyActionSheet from '../components/property/details/PropertyActionSheet.vue'
import PropertyBookingPanel from '../components/property/details/PropertyBookingPanel.vue'
import PropertyComparisonTray from '../components/property/details/PropertyComparisonTray.vue'
import PropertyMediaGallery from '../components/property/details/PropertyMediaGallery.vue'
import SimilarProperties from '../components/property/details/SimilarProperties.vue'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { usePropertyComparison } from '../composables/usePropertyComparison'
import { useRecentlyViewedProperties } from '../composables/useRecentlyViewedProperties'
import { useSavedProperties } from '../composables/useSavedProperties'
import { designedMarketplacePropertyRecords } from '../data/designedMarketplaceProperties'
import { getUserProfile } from '../services/auth'
import { isInspectionMode, resolveBookingMode } from '../services/bookingModes'
import type { PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'

import '../assets/styles/property-details.css'

const PropertyMapPreview = defineAsyncComponent(
  () => import('../components/map/PropertyMapPreview.vue')
)

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'
type MessageTone = 'success' | 'error' | 'info'

interface ComparisonTrayExposed {
  openComparison: () => void
}

const route = useRoute()
const router = useRouter()
const { state, canManageProperties } = useAuth()
const { properties, hasLoaded, findById } = useProperties()
const {
  savedRecords,
  refresh: refreshSaved,
  propertyIsSaved,
  toggleSavedProperty,
} = useSavedProperties()
const {
  selectedPropertyIds,
  comparisonCount,
  comparisonIsFull,
  includes: comparisonIncludes,
  toggle: toggleComparison,
  remove: removeComparisonProperty,
  clear: clearComparison,
  prune: pruneComparison,
} = usePropertyComparison()
const { remember: rememberRecentlyViewed } = useRecentlyViewedProperties()

const property = ref<PropertyRecord | null>(null)
const ownerProfile = ref<UserProfile | null>(null)
const loadState = ref<LoadState>('loading')
const savingPropertyId = ref('')
const actionMessage = ref('')
const actionMessageTone = ref<MessageTone>('info')
const descriptionIsExpanded = ref(false)
const showAllAmenities = ref(false)
const isActionSheetOpen = ref(false)
const mapShouldRender = ref(false)
const mapSectionRef = ref<HTMLElement | null>(null)
const comparisonTrayRef = ref<ComparisonTrayExposed | null>(null)
const moreMenuRef = ref<HTMLDetailsElement | null>(null)

let propertyLoadRequest = 0
let messageTimer: ReturnType<typeof setTimeout> | null = null
let mapObserver: IntersectionObserver | null = null

watch(
  () => route.params.propertyId,
  (propertyId) => {
    void loadProperty(typeof propertyId === 'string' ? propertyId : '')
  },
  { immediate: true }
)

watch(
  () => state.profile?.uid,
  (userId) => {
    void refreshSaved(userId).catch(() => undefined)
  },
  { immediate: true }
)

watch(
  [hasLoaded, property],
  ([loaded, currentProperty]) => {
    if (!loaded || !currentProperty) return

    pruneComparison(
      new Set([
        ...designedMarketplacePropertyRecords.map((item) => item.id),
        ...properties.value.map((item) => item.id),
        currentProperty.id,
      ])
    )
  },
  { immediate: true }
)

const canEdit = computed(
  () =>
    Boolean(property.value) &&
    Boolean(state.profile) &&
    (property.value?.ownerId === state.profile?.uid || state.profile?.role === 'admin')
)

const isCurrentPropertySaved = computed(() =>
  property.value ? propertyIsSaved(state.profile?.uid, property.value.id) : false
)

const savedPropertyIds = computed(
  () => new Set(savedRecords.value.map((record) => record.propertyId))
)

const currentPropertyIsCompared = computed(() =>
  property.value ? comparisonIncludes(property.value.id) : false
)

const fullAddress = computed(() => {
  if (!property.value) return ''

  const parts = [
    property.value.address,
    property.value.area,
    property.value.city,
    property.value.state,
  ].filter(Boolean)

  return parts
    .filter(
      (part, index) =>
        parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index
    )
    .join(', ')
})

const directionsUrl = computed(() => {
  if (!property.value) return ''

  const destination =
    property.value.latitude !== null && property.value.longitude !== null
      ? `${property.value.latitude},${property.value.longitude}`
      : fullAddress.value

  return destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : ''
})

const listedDate = computed(() => formatDate(property.value?.createdAt ?? ''))
const updatedDate = computed(() => {
  if (!property.value?.updatedAt || property.value.updatedAt === property.value.createdAt) return ''
  return formatDate(property.value.updatedAt)
})

const propertyAvailabilityLabel = computed<'Available' | 'Booking'>(() => {
  if (!property.value || isInspectionMode(resolveBookingMode(property.value))) return 'Available'
  return 'Booking'
})

const listingPulse = computed(() => {
  if (!property.value) return ''
  if (!property.value.isAvailable) {
    return 'This listing is currently unavailable for new enquiries.'
  }
  if (property.value.inspectionFee > 0) {
    return 'Available for enquiries and inspection booking.'
  }
  return 'Available for enquiries and visit scheduling.'
})

const quickFacts = computed(() => {
  if (!property.value) return []

  return [
    property.value.bedrooms !== null
      ? { label: 'Bedrooms', value: String(property.value.bedrooms), icon: bedOutline }
      : null,
    property.value.bathrooms !== null
      ? { label: 'Bathrooms', value: String(property.value.bathrooms), icon: waterOutline }
      : null,
    property.value.toilets !== null
      ? { label: 'Toilets', value: String(property.value.toilets), icon: keyOutline }
      : null,
    property.value.shopSize
      ? { label: 'Shop size', value: property.value.shopSize, icon: resizeOutline }
      : null,
    property.value.parking ? { label: 'Parking', value: 'Available', icon: carOutline } : null,
    property.value.roadAccess
      ? { label: 'Road access', value: 'Available', icon: navigateOutline }
      : null,
  ].filter((fact): fact is { label: string; value: string; icon: string } => Boolean(fact))
})

const amenityItems = computed(() => {
  if (!property.value) return []

  const items = property.value.amenities
    .filter(Boolean)
    .map((label) => ({ label, icon: sparklesOutline }))

  const supportedFeatures = [
    property.value.kitchen ? { label: 'Kitchen', icon: restaurantOutline } : null,
    property.value.parking ? { label: 'Parking', icon: carOutline } : null,
    property.value.water || property.value.waterAccess
      ? { label: 'Water supply', icon: waterOutline }
      : null,
    property.value.electricity || property.value.electricityAvailability
      ? { label: 'Electricity', icon: flashOutline }
      : null,
    property.value.security ? { label: 'Security', icon: shieldCheckmarkOutline } : null,
    property.value.roadAccess ? { label: 'Road access', icon: navigateOutline } : null,
    property.value.marketArea ? { label: 'Market area', icon: storefrontOutline } : null,
  ].filter((item): item is { label: string; icon: string } => Boolean(item))

  return [...items, ...supportedFeatures].filter(
    (item, index, allItems) =>
      allItems.findIndex(
        (candidate) => candidate.label.toLowerCase() === item.label.toLowerCase()
      ) === index
  )
})

const visibleAmenities = computed(() =>
  showAllAmenities.value ? amenityItems.value : amenityItems.value.slice(0, 8)
)
const descriptionIsLong = computed(() => (property.value?.description.length ?? 0) > 420)
const visibleDescription = computed(() => {
  const description = property.value?.description ?? ''
  if (!descriptionIsLong.value || descriptionIsExpanded.value) return description
  return `${description.slice(0, 420).trimEnd()}…`
})

const similarProperties = computed(() => {
  if (!property.value) return []

  const current = property.value
  return properties.value
    .filter((candidate) => candidate.id !== current.id && candidate.status === 'approved')
    .map((candidate) => ({
      candidate,
      score: calculateSimilarityScore(current, candidate),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.candidate.createdAt.localeCompare(left.candidate.createdAt)
    )
    .slice(0, 8)
    .map(({ candidate }) => candidate)
})

const comparisonProperties = computed(() => {
  const recordMap = new Map(
    [...designedMarketplacePropertyRecords, ...properties.value].map((item) => [item.id, item])
  )
  if (property.value) recordMap.set(property.value.id, property.value)

  return selectedPropertyIds.value
    .map((propertyId) => recordMap.get(propertyId))
    .filter((item): item is PropertyRecord => Boolean(item))
})

const beforeBookingItems = [
  'Review every available property photo and the listing description.',
  'Confirm the address and pinned location before travelling.',
  'Review the inspection, agency, caution, and rent amounts shown.',
  'Contact the listed property representative if you need more details.',
  'Schedule an inspection before making a full rent payment.',
]

async function loadProperty(propertyId: string) {
  const requestId = ++propertyLoadRequest
  loadState.value = 'loading'
  property.value = null
  ownerProfile.value = null
  descriptionIsExpanded.value = false
  showAllAmenities.value = false
  isActionSheetOpen.value = false
  mapShouldRender.value = false

  if (!propertyId) {
    loadState.value = 'not-found'
    return
  }

  try {
    const result = await findById(propertyId)
    if (requestId !== propertyLoadRequest) return

    if (!result) {
      loadState.value = 'not-found'
      return
    }

    property.value = result
    rememberRecentlyViewed(result.id)
    loadState.value = 'ready'
    await nextTick()
    observeMapSection()

    if (result.ownerId) {
      void getUserProfile(result.ownerId)
        .then((profile) => {
          if (requestId === propertyLoadRequest) ownerProfile.value = profile
        })
        .catch(() => {
          if (requestId === propertyLoadRequest) ownerProfile.value = null
        })
    }
  } catch {
    if (requestId === propertyLoadRequest) loadState.value = 'error'
  }
}

function retryPropertyLoad() {
  const propertyId = route.params.propertyId
  void loadProperty(typeof propertyId === 'string' ? propertyId : '')
}

function observeMapSection() {
  mapObserver?.disconnect()
  mapObserver = null

  if (!property.value || typeof IntersectionObserver === 'undefined') {
    mapShouldRender.value = true
    return
  }

  mapObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      mapShouldRender.value = true
      mapObserver?.disconnect()
      mapObserver = null
    },
    { rootMargin: '240px 0px' }
  )

  if (mapSectionRef.value) mapObserver.observe(mapSectionRef.value)
  else mapShouldRender.value = true
}

async function handleToggleSaved(targetProperty: PropertyRecord) {
  if (savingPropertyId.value) return
  savingPropertyId.value = targetProperty.id

  try {
    await toggleSavedProperty(state.profile?.uid, targetProperty)
    const saved = propertyIsSaved(state.profile?.uid, targetProperty.id)
    setActionMessage(
      saved ? 'Property saved to your favorites.' : 'Property removed from your saved list.',
      'success'
    )
  } catch {
    setActionMessage('Could not update your saved properties. Please try again.', 'error')
  } finally {
    savingPropertyId.value = ''
  }
}

function handleToggleComparison(targetProperty: PropertyRecord) {
  const result = toggleComparison(targetProperty.id)
  if (result === 'limit') {
    setActionMessage('You can compare up to three properties at a time.', 'info')
    return
  }

  setActionMessage(
    result === 'added' ? 'Property added to comparison.' : 'Property removed from comparison.',
    'success'
  )
}

function openComparisonFromSheet() {
  isActionSheetOpen.value = false
  void nextTick(() => comparisonTrayRef.value?.openComparison())
}

async function shareProperty() {
  if (!property.value) return

  try {
    if (navigator.share) {
      await navigator.share({
        title: property.value.title,
        text: `${property.value.title} on RANDSA`,
        url: window.location.href,
      })
      setActionMessage('Listing shared.', 'success')
    } else {
      await copyText(window.location.href)
      setActionMessage('Listing link copied.', 'success')
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    setActionMessage('Could not share this listing.', 'error')
  }
}

async function copyCurrentLink() {
  moreMenuRef.value?.removeAttribute('open')
  try {
    await copyText(window.location.href)
    setActionMessage('Listing link copied.', 'success')
  } catch {
    setActionMessage('Could not copy the listing link.', 'error')
  }
}

async function copyAddress() {
  try {
    await copyText(fullAddress.value)
    setActionMessage('Property address copied.', 'success')
  } catch {
    setActionMessage('Could not copy the property address.', 'error')
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('Copy failed')
}

function printProperty() {
  moreMenuRef.value?.removeAttribute('open')
  window.print()
}

function goBack() {
  if (window.history.length > 1) router.back()
  else void router.push('/properties')
}

function setActionMessage(message: string, tone: MessageTone) {
  actionMessage.value = message
  actionMessageTone.value = tone
  if (messageTimer) clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    actionMessage.value = ''
    messageTimer = null
  }, 4200)
}

function calculateSimilarityScore(current: PropertyRecord, candidate: PropertyRecord) {
  let score = 0
  const normalize = (value: string) => value.trim().toLowerCase()

  if (candidate.propertyType === current.propertyType) score += 9
  if (normalize(candidate.area) && normalize(candidate.area) === normalize(current.area)) score += 7
  if (normalize(candidate.city) && normalize(candidate.city) === normalize(current.city)) score += 5
  if (normalize(candidate.state) && normalize(candidate.state) === normalize(current.state))
    score += 3

  const priceDifference =
    current.rentPrice > 0
      ? Math.abs(candidate.rentPrice - current.rentPrice) / current.rentPrice
      : Number.POSITIVE_INFINITY
  if (priceDifference <= 0.25) score += 4
  else if (priceDifference <= 0.5) score += 2

  if (candidate.bedrooms !== null && candidate.bedrooms === current.bedrooms) score += 2
  if (candidate.isAvailable === current.isAvailable) score += 1
  return score
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPeriod(value: string) {
  return value.replaceAll('_', ' ')
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

onBeforeUnmount(() => {
  mapObserver?.disconnect()
  if (messageTimer) clearTimeout(messageTimer)
})
</script>
