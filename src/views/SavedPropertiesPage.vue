<template>
  <AppShell content-class="min-h-full w-full">
    <div class="saved-workspace">
      <aside class="saved-sidebar" aria-label="Saved Properties navigation">
        <RouterLink to="/home" class="saved-brand" aria-label="RANDSA home">
          <span aria-hidden="true">R</span>
          <strong>RANDSA</strong>
        </RouterLink>

        <nav class="saved-nav" aria-label="Primary navigation">
          <RouterLink
            v-for="item in sidebarItems"
            :key="item.label"
            :to="item.to"
            class="saved-nav__link"
            :class="{ 'is-active': isNavigationActive(item.matchers) }"
          >
            <IonIcon :icon="item.icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <RouterLink to="/profile" class="saved-account" aria-label="Open Account Center">
          <img
            v-if="state.profile?.photoURL"
            :src="state.profile.photoURL"
            :alt="`${state.profile.fullName} profile`"
            loading="lazy"
            decoding="async"
          />
          <span v-else class="saved-account__avatar" aria-hidden="true">{{ profileInitial }}</span>
          <span class="saved-account__copy">
            <strong>{{ state.profile?.fullName || 'RANDSA account' }}</strong>
            <small>{{ profileRoleLabel }}</small>
          </span>
          <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
        </RouterLink>
      </aside>

      <main class="saved-main">
        <header class="saved-header" aria-labelledby="saved-page-title">
          <div>
            <p class="saved-breadcrumb"><span>RANDSA</span> / SAVED</p>
            <div class="saved-title-row">
              <h1 id="saved-page-title">Saved listings</h1>
              <span aria-hidden="true"><IonIcon :icon="heartOutline" /></span>
            </div>
            <p>Your favorite marketplace listings now live here for quick return visits.</p>
          </div>

          <div class="saved-header-actions">
            <label class="sort-control">
              <span>Sort by</span>
              <select v-model="sortMode" aria-label="Sort saved listings">
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <IonIcon :icon="chevronDownOutline" aria-hidden="true" />
            </label>
            <button type="button" class="filter-trigger" @click="openFilters">
              <IonIcon :icon="funnelOutline" aria-hidden="true" />
              <span>Filters</span>
              <strong v-if="activeFilterCount" aria-label="Active filters">{{
                activeFilterCount
              }}</strong>
            </button>
          </div>
        </header>

        <section class="saved-summary" aria-label="Saved listings summary">
          <article v-for="stat in summaryStats" :key="stat.label">
            <span class="saved-summary__icon" :class="stat.tone" aria-hidden="true">
              <IonIcon :icon="stat.icon" />
            </span>
            <div>
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.label }}</span>
            </div>
          </article>
        </section>

        <div class="saved-mobile-controls">
          <label class="sort-control">
            <span>Sort by</span>
            <select v-model="sortMode" aria-label="Sort saved listings">
              <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <IonIcon :icon="chevronDownOutline" aria-hidden="true" />
          </label>
          <button type="button" class="filter-trigger" @click="openFilters">
            <IonIcon :icon="funnelOutline" aria-hidden="true" />
            <span>Filters</span>
            <strong v-if="activeFilterCount" aria-label="Active filters">{{
              activeFilterCount
            }}</strong>
          </button>
        </div>

        <section
          v-if="isInitialLoading"
          class="saved-skeleton-grid"
          aria-label="Loading saved listings"
        >
          <article v-for="index in 4" :key="index" class="saved-skeleton" aria-hidden="true">
            <span class="saved-skeleton__media" />
            <div><span /><span /><span /><span /></div>
          </article>
        </section>

        <section v-else-if="hasLoadError" class="saved-state-card is-error" role="alert">
          <span class="saved-state-card__icon"
            ><IonIcon :icon="alertCircleOutline" aria-hidden="true"
          /></span>
          <div>
            <h2>Saved listings could not be loaded</h2>
            <p>Check your connection and try loading your saved listings again.</p>
          </div>
          <button type="button" :disabled="isRetrying" @click="retryLoad">
            <IonSpinner v-if="isRetrying" name="crescent" aria-hidden="true" />
            <IonIcon v-else :icon="refreshOutline" aria-hidden="true" />
            {{ isRetrying ? 'Retrying...' : 'Retry' }}
          </button>
        </section>

        <template v-else-if="savedItems.length">
          <section
            v-if="visibleSavedItems.length"
            class="saved-desktop-grid"
            aria-label="Saved marketplace listings"
          >
            <article
              v-for="item in visibleSavedItems"
              :key="item.record.id"
              class="saved-property-card"
            >
              <div class="saved-property-card__media">
                <RouterLink :to="item.item.detailPath" :aria-label="`View ${item.item.title}`">
                  <img
                    v-if="item.item.image"
                    :src="item.item.image"
                    :alt="item.item.title"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else class="saved-image-placeholder">
                    <IonIcon :icon="businessOutline" aria-hidden="true" />
                    <small>Image unavailable</small>
                  </span>
                </RouterLink>
                <button
                  type="button"
                  class="saved-heart-button"
                  :aria-label="`Remove ${item.item.title} from saved listings`"
                  @click="openRemoveDialog(item)"
                >
                  <IonIcon :icon="heart" aria-hidden="true" />
                </button>
              </div>

              <div class="saved-property-card__body">
                <div class="saved-property-card__title-row">
                  <div>
                    <RouterLink :to="item.item.detailPath">{{ item.item.title }}</RouterLink>
                    <p>
                      <IonIcon :icon="locationOutline" aria-hidden="true" />{{
                        item.item.location || 'Location not added'
                      }}
                    </p>
                  </div>
                  <button type="button" @click="openRemoveDialog(item)">
                    <IonIcon :icon="trashOutline" aria-hidden="true" /> Remove
                  </button>
                </div>
                <p class="saved-property-card__price">
                  {{ item.item.price }}
                  <span v-if="item.item.paymentDuration">/ {{ item.item.paymentDuration }}</span>
                </p>
                <div class="saved-badges">
                  <span class="is-type">{{
                    item.item.subcategoryName || item.item.categoryName
                  }}</span>
                  <span class="is-available">
                    {{ item.item.availabilityLabel }}
                  </span>
                </div>
              </div>

              <footer class="saved-property-card__footer">
                <span class="saved-date">
                  <IonIcon :icon="calendarOutline" aria-hidden="true" />
                  <span
                    ><small>Saved on</small
                    ><strong>{{ formatSavedDate(item.savedAt) }}</strong></span
                  >
                </span>
                <RouterLink :to="item.item.detailPath">
                  View details <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
                </RouterLink>
              </footer>
            </article>
          </section>

          <section
            v-if="visibleSavedItems.length"
            class="saved-mobile-list"
            aria-label="Saved marketplace listings"
          >
            <article v-for="item in visibleSavedItems" :key="item.record.id">
              <RouterLink
                :to="item.item.detailPath"
                class="saved-mobile-item__media"
                :aria-label="`View ${item.item.title}`"
              >
                <img
                  v-if="item.item.image"
                  :src="item.item.image"
                  :alt="item.item.title"
                  loading="lazy"
                  decoding="async"
                />
                <span v-else class="saved-image-placeholder">
                  <IonIcon :icon="businessOutline" aria-hidden="true" />
                </span>
              </RouterLink>

              <div class="saved-mobile-item__content">
                <div class="saved-mobile-item__heading">
                  <RouterLink :to="item.item.detailPath">{{ item.item.title }}</RouterLink>
                  <button
                    type="button"
                    :aria-label="`Remove ${item.item.title} from saved listings`"
                    @click="openRemoveDialog(item)"
                  >
                    <IonIcon :icon="heart" aria-hidden="true" />
                  </button>
                </div>
                <p class="saved-mobile-location">
                  <IonIcon :icon="locationOutline" aria-hidden="true" />{{
                    item.item.location || 'Location not added'
                  }}
                </p>
                <p class="saved-mobile-price">
                  {{ item.item.price }}
                  <template v-if="item.item.paymentDuration">
                    / {{ item.item.paymentDuration }}</template
                  >
                </p>
                <div class="saved-badges">
                  <span class="is-type">{{
                    item.item.subcategoryName || item.item.categoryName
                  }}</span>
                  <span class="is-available">
                    {{ item.item.availabilityLabel }}
                  </span>
                </div>
              </div>

              <footer class="saved-mobile-item__footer">
                <span>Saved on {{ formatSavedDate(item.savedAt) }}</span>
                <button type="button" @click="openRemoveDialog(item)">
                  <IonIcon :icon="trashOutline" aria-hidden="true" /> Remove
                </button>
              </footer>
            </article>
          </section>

          <section v-else class="saved-state-card is-filtered">
            <span class="saved-state-card__icon"
              ><IonIcon :icon="funnelOutline" aria-hidden="true"
            /></span>
            <div>
              <h2>No saved listings match these filters</h2>
              <p>Clear your filters to return to your full saved list.</p>
            </div>
            <button type="button" @click="clearAppliedFilters">Clear filters</button>
          </section>

          <section v-if="visibleSavedItems.length" class="saved-discovery-banner">
            <span aria-hidden="true">
              <IonIcon :icon="businessOutline" />
              <IonIcon :icon="heart" />
            </span>
            <div>
              <h2>No more saved listings yet?</h2>
              <p>Browse the marketplace and save the listings you want to revisit.</p>
            </div>
            <RouterLink to="/home#listings">Browse listings</RouterLink>
          </section>
        </template>

        <section v-else class="saved-empty-state">
          <div class="saved-empty-state__art" aria-hidden="true">
            <IonIcon :icon="businessOutline" />
            <span><IonIcon :icon="heart" /></span>
          </div>
          <h2>No saved listings yet?</h2>
          <p>
            Browse listings and tap the heart icon to save items you love. They will appear here.
          </p>
          <RouterLink to="/home#listings">
            <IonIcon :icon="searchOutline" aria-hidden="true" /> Browse listings
          </RouterLink>
        </section>
      </main>
    </div>

    <div class="saved-mobile-nav"><AppBottomNav /></div>

    <Teleport to="body">
      <Transition name="saved-dialog">
        <div
          v-if="isFiltersOpen"
          class="saved-dialog-backdrop"
          role="presentation"
          @mousedown.self="closeFilters"
        >
          <section
            ref="filterDialogRef"
            class="saved-filter-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-filter-title"
            tabindex="-1"
            @keydown="handleDialogKeydown($event, 'filters')"
          >
            <header>
              <div>
                <p>Refine your list</p>
                <h2 id="saved-filter-title">Filters</h2>
              </div>
              <button type="button" aria-label="Close filters" @click="closeFilters">
                <IonIcon :icon="closeOutline" aria-hidden="true" />
              </button>
            </header>

            <div class="saved-filter-fields">
              <label>
                <span>Category</span>
                <select v-model="filterDraft.categoryId">
                  <option value="all">All categories</option>
                  <option v-for="category in categoryOptions" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
              </label>
              <label>
                <span>Location</span>
                <select v-model="filterDraft.location">
                  <option value="all">All locations</option>
                  <option v-for="location in locationOptions" :key="location" :value="location">
                    {{ location }}
                  </option>
                </select>
              </label>
              <label>
                <span>Availability</span>
                <select v-model="filterDraft.availability">
                  <option value="all">Any availability</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </label>
              <label>
                <span>Saved date</span>
                <select v-model="filterDraft.savedPeriod">
                  <option value="all">Any saved date</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </label>
              <div class="saved-price-filter">
                <span>Price range (NGN)</span>
                <div>
                  <label
                    ><span>Minimum</span
                    ><input
                      v-model.number="filterDraft.minPrice"
                      type="number"
                      min="0"
                      placeholder="No minimum"
                  /></label>
                  <label
                    ><span>Maximum</span
                    ><input
                      v-model.number="filterDraft.maxPrice"
                      type="number"
                      min="0"
                      placeholder="No maximum"
                  /></label>
                </div>
              </div>
            </div>

            <footer>
              <button type="button" class="is-clear" @click="clearFilterDraft">Clear all</button>
              <button type="button" class="is-apply" @click="applyFilters">Apply filters</button>
            </footer>
          </section>
        </div>
      </Transition>

      <Transition name="saved-dialog">
        <div
          v-if="pendingRemoval"
          class="saved-dialog-backdrop is-centered"
          role="presentation"
          @mousedown.self="closeRemoveDialog"
        >
          <section
            ref="removeDialogRef"
            class="saved-remove-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-saved-title"
            aria-describedby="remove-saved-description"
            tabindex="-1"
            @keydown="handleDialogKeydown($event, 'remove')"
          >
            <span class="saved-remove-dialog__icon" aria-hidden="true"
              ><IonIcon :icon="trashOutline"
            /></span>
            <h2 id="remove-saved-title">Remove from saved?</h2>
            <p id="remove-saved-description">This listing will be removed from your saved list.</p>
            <strong>{{ pendingRemoval.item.title }}</strong>
            <footer>
              <button type="button" :disabled="isRemoving" @click="closeRemoveDialog">
                Cancel
              </button>
              <button type="button" class="is-danger" :disabled="isRemoving" @click="confirmRemove">
                <IonSpinner v-if="isRemoving" name="crescent" aria-hidden="true" />
                <IonIcon v-else :icon="trashOutline" aria-hidden="true" />
                {{ isRemoving ? 'Removing...' : 'Remove' }}
              </button>
            </footer>
          </section>
        </div>
      </Transition>

      <Transition name="saved-toast">
        <div
          v-if="toastMessage"
          class="saved-toast"
          :class="toastTone"
          role="status"
          aria-live="polite"
        >
          <IonIcon
            :icon="toastTone === 'is-success' ? checkmarkCircleOutline : alertCircleOutline"
            aria-hidden="true"
          />
          <span>{{ toastMessage }}</span>
          <button type="button" aria-label="Dismiss notification" @click="dismissToast">
            <IonIcon :icon="closeOutline" aria-hidden="true" />
          </button>
        </div>
      </Transition>
    </Teleport>
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
  chevronDownOutline,
  chevronForwardOutline,
  closeOutline,
  funnelOutline,
  heart,
  heartOutline,
  homeOutline,
  locationOutline,
  notificationsOutline,
  personOutline,
  refreshOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons'
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import AppBottomNav from '../components/navigation/AppBottomNav.vue'
import { useAuth } from '../composables/useAuth'
import { useListings } from '../composables/useListings'
import { useProperties } from '../composables/useProperties'
import { useSavedProperties } from '../composables/useSavedProperties'
import { designedMarketplacePropertyRecords } from '../data/designedMarketplaceProperties'
import {
  listingToMarketplaceItem,
  propertyToMarketplaceItem,
} from '../services/marketplaceDiscovery'
import type { SavedPropertyRecord } from '../services/savedProperties'
import type { MarketplaceDiscoveryItem } from '../types/marketplace'
import { savedItemKey } from '../utils/savedRecords'

type SortMode = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc'
type AvailabilityFilter = 'all' | 'available' | 'unavailable'
type SavedPeriodFilter = 'all' | '7' | '30' | '90'

interface SavedItem {
  item: MarketplaceDiscoveryItem
  record: SavedPropertyRecord
  savedAt: string
}

interface SavedFilters {
  categoryId: string
  location: string
  availability: AvailabilityFilter
  savedPeriod: SavedPeriodFilter
  minPrice: number | null
  maxPrice: number | null
}

const route = useRoute()
const { state, canManageProperties } = useAuth()
const {
  properties,
  hasLoaded: havePropertiesLoaded,
  isLoading: arePropertiesLoading,
  error: propertyLoadError,
  refresh: refreshProperties,
} = useProperties()
const {
  publicListings,
  isLoading: areListingsLoading,
  refreshPublic: refreshPublicListings,
} = useListings()
const {
  refresh: refreshSaved,
  savedRecords,
  toggleSavedItem,
  isLoading: areSavedRecordsLoading,
  hasLoaded: haveSavedRecordsLoaded,
  error: savedRecordsError,
} = useSavedProperties()

const sortMode = ref<SortMode>('newest')
const isFiltersOpen = ref(false)
const pendingRemoval = ref<SavedItem | null>(null)
const isRemoving = ref(false)
const isRetrying = ref(false)
const filterDialogRef = ref<HTMLElement | null>(null)
const removeDialogRef = ref<HTMLElement | null>(null)
const returnFocusElement = ref<HTMLElement | null>(null)
const toastMessage = ref('')
const toastTone = ref<'is-success' | 'is-error'>('is-success')
let toastTimer: number | null = null
let previousBodyOverflow = ''

const createEmptyFilters = (): SavedFilters => ({
  categoryId: 'all',
  location: 'all',
  availability: 'all',
  savedPeriod: 'all',
  minPrice: null,
  maxPrice: null,
})

const filterDraft = reactive<SavedFilters>(createEmptyFilters())
const appliedFilters = ref<SavedFilters>(createEmptyFilters())

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: 'newest', label: 'Newest saved' },
  { value: 'oldest', label: 'Oldest saved' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
]

const sidebarItems = computed(() => [
  { label: 'Home', to: '/home', icon: homeOutline, matchers: ['/home'] },
  ...(canManageProperties.value
    ? [
        {
          label: 'Post Listing',
          to: '/post-listing',
          icon: addCircleOutline,
          matchers: ['/post-listing', '/add-property', '/edit-property', '/edit-listing'],
        },
      ]
    : []),
  {
    label: 'Bookings',
    to: '/my-bookings',
    icon: calendarOutline,
    matchers: ['/my-bookings', '/booking'],
  },
  {
    label: 'Saved listings',
    to: '/saved-properties',
    icon: bookmarkOutline,
    matchers: ['/saved-properties'],
  },
  { label: 'Payments', to: '/payment', icon: cardOutline, matchers: ['/payment'] },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: notificationsOutline,
    matchers: ['/notifications'],
  },
  { label: 'Account Center', to: '/profile', icon: personOutline, matchers: ['/profile'] },
])

const savedItems = computed<SavedItem[]>(() => {
  const marketplaceItems = [
    ...designedMarketplacePropertyRecords.map((property) =>
      propertyToMarketplaceItem(property, { source: 'fallback' })
    ),
    ...properties.value.map((property) => propertyToMarketplaceItem(property)),
    ...publicListings.value.map(listingToMarketplaceItem),
  ]
  const itemMap = new Map(
    marketplaceItems.map((item) => [savedItemKey(item.id, item.saveSource), item])
  )
  return savedRecords.value.flatMap((record) => {
    const savedItem = itemMap.get(savedItemKey(record.propertyId, record.source))
    return savedItem ? [{ item: savedItem, record, savedAt: record.createdAt }] : []
  })
})

const categoryOptions = computed(() =>
  [...new Set(savedItems.value.map((item) => item.item.categoryName))].sort((left, right) =>
    left.localeCompare(right)
  )
)
const locationOptions = computed(() =>
  [...new Set(savedItems.value.map((item) => item.item.state).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right)
  )
)
const activeFilterCount = computed(() => {
  const filters = appliedFilters.value
  return [
    filters.categoryId !== 'all',
    filters.location !== 'all',
    filters.availability !== 'all',
    filters.savedPeriod !== 'all',
    filters.minPrice !== null && filters.minPrice > 0,
    filters.maxPrice !== null && filters.maxPrice > 0,
  ].filter(Boolean).length
})
const visibleSavedItems = computed(() => {
  const filters = appliedFilters.value
  const now = Date.now()
  const filtered = savedItems.value.filter((item) => {
    if (filters.categoryId !== 'all' && item.item.categoryName !== filters.categoryId) return false
    if (filters.location !== 'all' && item.item.state !== filters.location) return false
    if (filters.availability === 'available' && item.item.availabilityLabel === 'Unavailable')
      return false
    if (filters.availability === 'unavailable' && item.item.availabilityLabel !== 'Unavailable')
      return false
    if (filters.minPrice !== null && item.item.numericPrice < filters.minPrice) return false
    if (
      filters.maxPrice !== null &&
      filters.maxPrice > 0 &&
      item.item.numericPrice > filters.maxPrice
    )
      return false
    if (filters.savedPeriod !== 'all') {
      const cutoff = now - Number(filters.savedPeriod) * 24 * 60 * 60 * 1000
      if (new Date(item.savedAt).getTime() < cutoff) return false
    }
    return true
  })

  return [...filtered].sort((left, right) => {
    if (sortMode.value === 'oldest') return left.savedAt.localeCompare(right.savedAt)
    if (sortMode.value === 'price-low') return left.item.numericPrice - right.item.numericPrice
    if (sortMode.value === 'price-high') return right.item.numericPrice - left.item.numericPrice
    if (sortMode.value === 'name-asc') return left.item.title.localeCompare(right.item.title)
    if (sortMode.value === 'name-desc') return right.item.title.localeCompare(left.item.title)
    return right.savedAt.localeCompare(left.savedAt)
  })
})
const summaryStats = computed(() => [
  {
    label: 'Saved listings',
    value: savedItems.value.length,
    icon: heartOutline,
    tone: 'is-blue',
  },
  {
    label: 'Saved this week',
    value: savedItems.value.filter(
      (item) => new Date(item.savedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length,
    icon: calendarOutline,
    tone: 'is-green',
  },
  {
    label: 'Properties',
    value: savedItems.value.filter((item) => item.record.source === 'property').length,
    icon: homeOutline,
    tone: 'is-amber',
  },
  {
    label: 'Marketplace',
    value: savedItems.value.filter((item) => item.record.source === 'listing').length,
    icon: businessOutline,
    tone: 'is-purple',
  },
])
const isInitialLoading = computed(
  () =>
    (!havePropertiesLoaded.value && arePropertiesLoading.value) ||
    areListingsLoading.value ||
    (!haveSavedRecordsLoaded.value && areSavedRecordsLoading.value)
)
const hasLoadError = computed(
  () =>
    Boolean(savedRecordsError.value) ||
    (!havePropertiesLoaded.value && Boolean(propertyLoadError.value))
)
const profileInitial = computed(() =>
  (state.profile?.fullName || state.profile?.email || 'R').trim().charAt(0).toUpperCase()
)
const profileRoleLabel = computed(() => {
  const role = state.profile?.role
  return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : 'Signed-in account'
})
const isAnyDialogOpen = computed(() => isFiltersOpen.value || Boolean(pendingRemoval.value))

watch(
  () => state.profile?.uid,
  async (userId) => {
    if (!userId) {
      await refreshSaved(userId)
      return
    }
    await Promise.all([refreshSaved(userId), refreshProperties(), refreshPublicListings()]).catch(
      () => undefined
    )
  },
  { immediate: true }
)

watch(isAnyDialogOpen, (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
})

onBeforeUnmount(() => {
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  if (typeof document !== 'undefined') document.body.style.overflow = previousBodyOverflow
})

async function retryLoad() {
  isRetrying.value = true
  try {
    await Promise.all([
      refreshSaved(state.profile?.uid),
      refreshProperties(),
      refreshPublicListings(),
    ])
  } catch {
    showToast('Saved listings could not be loaded. Please try again.', 'is-error')
  } finally {
    isRetrying.value = false
  }
}

async function openFilters() {
  rememberFocusedElement()
  Object.assign(filterDraft, appliedFilters.value)
  isFiltersOpen.value = true
  await nextTick()
  focusFirstControl(filterDialogRef.value)
}

function closeFilters() {
  isFiltersOpen.value = false
  restoreFocus()
}

function clearFilterDraft() {
  Object.assign(filterDraft, createEmptyFilters())
}

function clearAppliedFilters() {
  appliedFilters.value = createEmptyFilters()
  Object.assign(filterDraft, createEmptyFilters())
}

function applyFilters() {
  const nextFilters = { ...filterDraft }
  if (nextFilters.minPrice !== null && nextFilters.minPrice < 0) nextFilters.minPrice = 0
  if (nextFilters.maxPrice !== null && nextFilters.maxPrice < 0) nextFilters.maxPrice = 0
  if (
    nextFilters.minPrice !== null &&
    nextFilters.maxPrice !== null &&
    nextFilters.maxPrice > 0 &&
    nextFilters.minPrice > nextFilters.maxPrice
  ) {
    ;[nextFilters.minPrice, nextFilters.maxPrice] = [nextFilters.maxPrice, nextFilters.minPrice]
  }
  appliedFilters.value = nextFilters
  closeFilters()
}

async function openRemoveDialog(item: SavedItem) {
  rememberFocusedElement()
  pendingRemoval.value = item
  await nextTick()
  focusFirstControl(removeDialogRef.value)
}

function closeRemoveDialog() {
  if (isRemoving.value) return
  pendingRemoval.value = null
  restoreFocus()
}

async function confirmRemove() {
  const item = pendingRemoval.value
  if (!item || isRemoving.value) return
  isRemoving.value = true
  try {
    await toggleSavedItem(state.profile?.uid, item.item)
    pendingRemoval.value = null
    showToast('Listing removed from saved items.', 'is-success')
    restoreFocus()
  } catch {
    showToast('The listing could not be removed. Please try again.', 'is-error')
  } finally {
    isRemoving.value = false
  }
}

function handleDialogKeydown(event: KeyboardEvent, dialog: 'filters' | 'remove') {
  if (event.key === 'Escape') {
    event.preventDefault()
    if (dialog === 'filters') closeFilters()
    else closeRemoveDialog()
    return
  }
  if (event.key !== 'Tab') return

  const root = dialog === 'filters' ? filterDialogRef.value : removeDialogRef.value
  if (!root) return
  const controls = [
    ...root.querySelectorAll<HTMLElement>(
      'button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
    ),
  ]
  if (!controls.length) return
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function rememberFocusedElement() {
  returnFocusElement.value =
    document.activeElement instanceof HTMLElement ? document.activeElement : null
}

function focusFirstControl(root: HTMLElement | null) {
  root
    ?.querySelector<HTMLElement>(
      'button:not(:disabled), select:not(:disabled), input:not(:disabled)'
    )
    ?.focus()
}

function restoreFocus() {
  void nextTick(() => returnFocusElement.value?.focus())
}

function showToast(message: string, tone: 'is-success' | 'is-error') {
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastMessage.value = message
  toastTone.value = tone
  toastTimer = window.setTimeout(dismissToast, 4000)
}

function dismissToast() {
  toastMessage.value = ''
  if (toastTimer !== null) window.clearTimeout(toastTimer)
  toastTimer = null
}

function isNavigationActive(matchers: string[]) {
  return matchers.some((matcher) => route.path === matcher || route.path.startsWith(`${matcher}/`))
}

function formatSavedDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
</script>

<style scoped>
.saved-workspace {
  --saved-bg: var(--rd-canvas);
  --saved-surface: var(--rd-surface);
  --saved-soft: var(--rd-surface-alt);
  --saved-text: var(--rd-ink);
  --saved-muted: var(--rd-muted);
  --saved-subtle: var(--rd-subtle);
  --saved-border: var(--rd-hairline);
  --saved-blue: var(--rd-brass);
  --saved-blue-dark: var(--rd-brass-strong);
  --saved-blue-soft: var(--rd-brass-soft);
  --saved-green: var(--rd-success);
  --saved-green-soft: var(--rd-success-bg);
  --saved-amber: var(--rd-warning);
  --saved-amber-soft: var(--rd-warning-bg);
  --saved-purple: var(--rd-info);
  --saved-purple-soft: var(--rd-info-bg);
  --saved-red: var(--rd-danger);
  --saved-red-soft: var(--rd-danger-bg);
  min-height: 100%;
  background: var(--saved-bg);
  color: var(--saved-text);
}

.saved-sidebar {
  display: none;
}
.saved-main {
  min-width: 0;
  padding: 18px 14px 116px;
}

.saved-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.saved-breadcrumb {
  margin: 0;
  color: var(--saved-subtle);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0;
}

.saved-breadcrumb span {
  color: var(--saved-blue);
}
.saved-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 9px;
}
.saved-title-row h1 {
  margin: 0;
  font-size: 31px;
  font-weight: 900;
  letter-spacing: 0;
}
.saved-title-row > span {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--saved-border);
  border-radius: 12px;
  background: var(--saved-surface);
  color: var(--saved-text);
  font-size: 21px;
}
.saved-header > div:first-child > p:last-child {
  margin: 8px 0 0;
  color: var(--saved-muted);
  font-size: 13px;
  line-height: 1.55;
}

.saved-header-actions,
.saved-mobile-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.saved-header-actions {
  display: none;
}
.saved-mobile-controls {
  margin-top: 12px;
}

.sort-control,
.filter-trigger {
  position: relative;
  display: flex;
  min-height: 46px;
  align-items: center;
  border: 1px solid var(--saved-border);
  border-radius: 12px;
  background: var(--saved-surface);
  color: var(--saved-text);
  box-shadow: 0 14px 30px -29px rgba(16, 32, 51, 0.65);
}

.sort-control {
  min-width: 0;
  flex: 1 1 auto;
  padding-left: 12px;
}
.sort-control > span {
  flex: 0 0 auto;
  font-size: 10px;
  font-weight: 850;
}
.sort-control select {
  min-width: 0;
  flex: 1 1 auto;
  min-height: 44px;
  appearance: none;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 0 32px 0 8px;
  color: var(--saved-text);
  font-size: 10px;
  font-weight: 750;
}
.sort-control > ion-icon {
  position: absolute;
  right: 11px;
  color: var(--saved-muted);
  pointer-events: none;
}
.filter-trigger {
  flex: 0 0 auto;
  justify-content: center;
  gap: 7px;
  padding: 0 13px;
  font-size: 10px;
  font-weight: 850;
}
.filter-trigger ion-icon {
  font-size: 17px;
}
.filter-trigger strong {
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  border-radius: 50%;
  background: var(--saved-blue);
  color: #fff;
  font-size: 8px;
}

.saved-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
  border: 1px solid var(--saved-border);
  border-radius: 18px;
  background: var(--saved-surface);
  box-shadow: 0 20px 48px -42px rgba(16, 32, 51, 0.62);
}

.saved-summary article {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 15px 12px;
}
.saved-summary article:nth-child(odd) {
  border-right: 1px solid var(--saved-border);
}
.saved-summary article:nth-child(-n + 2) {
  border-bottom: 1px solid var(--saved-border);
}
.saved-summary__icon {
  display: grid;
  width: 39px;
  height: 39px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  font-size: 20px;
}
.saved-summary__icon.is-blue {
  background: var(--saved-blue-soft);
  color: var(--saved-blue);
}
.saved-summary__icon.is-green {
  background: var(--saved-green-soft);
  color: var(--saved-green);
}
.saved-summary__icon.is-amber {
  background: var(--saved-amber-soft);
  color: var(--saved-amber);
}
.saved-summary__icon.is-purple {
  background: var(--saved-purple-soft);
  color: var(--saved-purple);
}
.saved-summary article strong,
.saved-summary article div span {
  display: block;
}
.saved-summary article strong {
  font-size: 19px;
  font-weight: 900;
}
.saved-summary article div span {
  margin-top: 2px;
  color: var(--saved-muted);
  font-size: 9px;
  line-height: 1.35;
}

.saved-skeleton-grid,
.saved-desktop-grid {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}
.saved-skeleton,
.saved-property-card {
  overflow: hidden;
  border: 1px solid var(--saved-border);
  border-radius: 18px;
  background: var(--saved-surface);
  box-shadow: 0 20px 45px -40px rgba(16, 32, 51, 0.65);
}
.saved-skeleton__media {
  display: block;
  aspect-ratio: 16 / 9;
  background: #e9eef5;
}
.saved-skeleton > div {
  display: grid;
  gap: 10px;
  padding: 18px;
}
.saved-skeleton > div span {
  display: block;
  height: 12px;
  border-radius: 7px;
  background: #e9eef5;
}
.saved-skeleton > div span:nth-child(1) {
  width: 62%;
}
.saved-skeleton > div span:nth-child(2) {
  width: 85%;
}
.saved-skeleton > div span:nth-child(3) {
  width: 45%;
  height: 20px;
}
.saved-skeleton > div span:nth-child(4) {
  width: 72%;
}
.saved-skeleton__media,
.saved-skeleton > div span {
  background-image: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
  background-size: 220% 100%;
  animation: saved-shimmer 1.4s ease-in-out infinite;
}

.saved-property-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease,
    transform 200ms ease;
}
.saved-property-card:hover {
  border-color: #cbd7e6;
  box-shadow: 0 26px 50px -38px rgba(16, 32, 51, 0.72);
  transform: translateY(-3px);
}
.saved-property-card__media {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--saved-soft);
}
.saved-property-card__media > a {
  display: block;
  width: 100%;
  height: 100%;
}
.saved-property-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 210ms ease;
}
.saved-property-card:hover .saved-property-card__media img {
  transform: scale(1.025);
}
.saved-image-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  align-content: center;
  gap: 7px;
  background: var(--saved-blue-soft);
  color: var(--saved-blue);
}
.saved-image-placeholder ion-icon {
  font-size: 36px;
}
.saved-image-placeholder small {
  color: var(--saved-muted);
  font-size: 9px;
}
.saved-heart-button {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: var(--saved-red);
  box-shadow: 0 13px 24px -16px rgba(16, 32, 51, 0.8);
  font-size: 21px;
  transition:
    transform 190ms ease,
    box-shadow 190ms ease;
}
.saved-heart-button:hover {
  box-shadow: 0 15px 25px -13px rgba(16, 32, 51, 0.75);
  transform: translateY(-2px) scale(1.04);
}
.saved-property-card__body {
  flex: 1 1 auto;
  padding: 18px 18px 16px;
}
.saved-property-card__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.saved-property-card__title-row > div {
  min-width: 0;
}
.saved-property-card__title-row a {
  display: block;
  overflow: hidden;
  color: var(--saved-text);
  font-size: 18px;
  font-weight: 900;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.saved-property-card__title-row p {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 6px 0 0;
  color: var(--saved-muted);
  font-size: 11px;
}
.saved-property-card__title-row p ion-icon {
  flex: 0 0 auto;
  color: var(--saved-blue);
  font-size: 14px;
}
.saved-property-card__title-row > button {
  display: inline-flex;
  min-height: 36px;
  flex: 0 0 auto;
  align-items: center;
  gap: 5px;
  border-radius: 9px;
  background: var(--saved-red-soft);
  padding: 0 10px;
  color: var(--saved-red);
  font-size: 9px;
  font-weight: 850;
}
.saved-property-card__price {
  margin: 18px 0 0;
  color: var(--saved-text);
  font-size: 21px;
  font-weight: 900;
}
.saved-property-card__price span {
  color: var(--saved-muted);
  font-size: 11px;
  font-weight: 650;
}
.saved-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}
.saved-badges span {
  display: inline-flex;
  min-height: 25px;
  align-items: center;
  border-radius: 9px;
  padding: 0 9px;
  font-size: 9px;
  font-weight: 800;
}
.saved-badges .is-type {
  background: var(--saved-blue-soft);
  color: var(--saved-blue);
}
.saved-badges .is-available {
  background: var(--saved-green-soft);
  color: var(--saved-green);
}
.saved-badges .is-unavailable {
  background: var(--saved-red-soft);
  color: var(--saved-red);
}
.saved-property-card__footer {
  display: flex;
  min-height: 62px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-top: 1px solid var(--saved-border);
  padding: 11px 18px;
}
.saved-date {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.saved-date > ion-icon {
  color: var(--saved-blue);
  font-size: 19px;
}
.saved-date small,
.saved-date strong {
  display: block;
}
.saved-date small {
  color: var(--saved-muted);
  font-size: 8px;
}
.saved-date strong {
  margin-top: 2px;
  font-size: 10px;
}
.saved-property-card__footer > a {
  display: inline-flex;
  min-height: 40px;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
  color: var(--saved-blue);
  font-size: 10px;
  font-weight: 850;
  text-decoration: none;
}
.saved-property-card__footer > a ion-icon {
  font-size: 15px;
  transition: transform 190ms ease;
}
.saved-property-card__footer > a:hover ion-icon {
  transform: translateX(3px);
}
.saved-mobile-list {
  display: none;
}

.saved-state-card,
.saved-empty-state,
.saved-discovery-banner {
  margin-top: 18px;
  border: 1px solid var(--saved-border);
  border-radius: 18px;
  background: var(--saved-surface);
  box-shadow: 0 20px 48px -42px rgba(16, 32, 51, 0.65);
}
.saved-state-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 20px;
}
.saved-state-card__icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 13px;
  background: var(--saved-blue-soft);
  color: var(--saved-blue);
  font-size: 23px;
}
.saved-state-card h2,
.saved-state-card p {
  margin: 0;
}
.saved-state-card h2 {
  font-size: 15px;
}
.saved-state-card p {
  margin-top: 5px;
  color: var(--saved-muted);
  font-size: 11px;
  line-height: 1.5;
}
.saved-state-card > button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #a8c8f6;
  border-radius: 10px;
  padding: 0 14px;
  color: var(--saved-blue);
  font-size: 10px;
  font-weight: 850;
}
.saved-state-card.is-error {
  border-color: #f2c1cb;
  background: var(--saved-red-soft);
}
.saved-state-card.is-error .saved-state-card__icon {
  background: var(--rd-surface);
  color: var(--saved-red);
}
.saved-empty-state {
  display: grid;
  min-height: 410px;
  place-items: center;
  align-content: center;
  padding: 36px 20px;
  text-align: center;
}
.saved-empty-state__art {
  position: relative;
  display: grid;
  width: 94px;
  height: 82px;
  place-items: center;
  border-radius: 24px;
  background: var(--saved-blue-soft);
  color: #77a4f5;
  font-size: 49px;
}
.saved-empty-state__art span {
  position: absolute;
  right: -7px;
  bottom: -7px;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 5px solid var(--saved-surface);
  border-radius: 50%;
  background: var(--saved-blue);
  color: #fff;
  font-size: 18px;
}
.saved-empty-state h2 {
  margin: 22px 0 0;
  font-size: 22px;
}
.saved-empty-state p {
  max-width: 490px;
  margin: 8px 0 0;
  color: var(--saved-muted);
  font-size: 12px;
  line-height: 1.65;
}
.saved-empty-state > a,
.saved-discovery-banner > a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 11px;
  background: var(--saved-blue);
  padding: 0 17px;
  color: #fff;
  font-size: 10px;
  font-weight: 850;
  text-decoration: none;
}
.saved-empty-state > a {
  margin-top: 19px;
}
.saved-discovery-banner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  background: var(--saved-blue-soft);
  padding: 20px;
}
.saved-discovery-banner > span {
  position: relative;
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 16px;
  background: var(--saved-surface);
  color: #7aa5f3;
  font-size: 29px;
}
.saved-discovery-banner > span ion-icon:last-child {
  position: absolute;
  right: -4px;
  bottom: -4px;
  color: var(--saved-blue);
  font-size: 19px;
}
.saved-discovery-banner h2,
.saved-discovery-banner p {
  margin: 0;
}
.saved-discovery-banner h2 {
  font-size: 14px;
}
.saved-discovery-banner p {
  margin-top: 5px;
  color: var(--saved-muted);
  font-size: 10px;
}
.saved-mobile-nav {
  display: block;
}

.saved-dialog-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  background: rgba(7, 17, 31, 0.42);
  backdrop-filter: blur(3px);
}
.saved-dialog-backdrop.is-centered {
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.saved-filter-dialog {
  display: flex;
  width: min(390px, 100%);
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-left: 1px solid #dce4ee;
  background: var(--rd-surface);
  color: var(--rd-ink);
  box-shadow: -24px 0 60px -40px rgba(7, 17, 31, 0.8);
}
.saved-filter-dialog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e1e7ef;
  padding: 22px;
}
.saved-filter-dialog > header p,
.saved-filter-dialog > header h2 {
  margin: 0;
}
.saved-filter-dialog > header p {
  color: var(--rd-brass);
  font-size: 9px;
  font-weight: 850;
}
.saved-filter-dialog > header h2 {
  margin-top: 4px;
  font-size: 23px;
}
.saved-filter-dialog > header button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 11px;
  background: #f3f6fa;
  color: #4b5d74;
  font-size: 21px;
}
.saved-filter-fields {
  display: grid;
  gap: 17px;
  overflow-y: auto;
  padding: 22px;
}
.saved-filter-fields > label > span,
.saved-price-filter > span,
.saved-price-filter label span {
  display: block;
  margin-bottom: 7px;
  color: var(--rd-muted);
  font-size: 10px;
  font-weight: 850;
}
.saved-filter-fields select,
.saved-filter-fields input {
  width: 100%;
  min-height: 46px;
  border: 1px solid #d8e1ec;
  border-radius: 11px;
  background: var(--rd-surface);
  padding: 0 12px;
  color: var(--rd-ink);
  font-size: 11px;
  outline: 0;
}
.saved-filter-fields select:focus,
.saved-filter-fields input:focus {
  border-color: #70a9f8;
  box-shadow: 0 0 0 4px rgba(23, 105, 239, 0.1);
}
.saved-price-filter > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.saved-price-filter label span {
  color: var(--rd-subtle);
  font-size: 8px;
}
.saved-filter-dialog > footer {
  display: flex;
  gap: 10px;
  margin-top: auto;
  border-top: 1px solid #e1e7ef;
  padding: 16px 22px max(16px, env(safe-area-inset-bottom));
}
.saved-filter-dialog > footer button {
  min-height: 46px;
  flex: 1 1 0;
  border-radius: 11px;
  font-size: 10px;
  font-weight: 850;
}
.saved-filter-dialog > footer .is-clear {
  border: 1px solid #cfd9e6;
  color: var(--rd-muted);
}
.saved-filter-dialog > footer .is-apply {
  background: var(--rd-brass);
  color: #fff;
}
.saved-remove-dialog {
  width: min(430px, 100%);
  border: 1px solid #e0e7ef;
  border-radius: 18px;
  background: var(--rd-surface);
  padding: 25px;
  color: var(--rd-ink);
  box-shadow: 0 28px 70px -38px rgba(7, 17, 31, 0.9);
  text-align: center;
}
.saved-remove-dialog__icon {
  display: grid;
  width: 54px;
  height: 54px;
  margin: 0 auto;
  place-items: center;
  border-radius: 15px;
  background: #fff0f3;
  color: #df294d;
  font-size: 25px;
}
.saved-remove-dialog h2 {
  margin: 16px 0 0;
  font-size: 21px;
}
.saved-remove-dialog p {
  margin: 7px 0 0;
  color: #66778d;
  font-size: 12px;
  line-height: 1.55;
}
.saved-remove-dialog > strong {
  display: block;
  overflow: hidden;
  margin-top: 12px;
  color: var(--rd-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.saved-remove-dialog footer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 22px;
}
.saved-remove-dialog footer button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid #cfd9e6;
  border-radius: 11px;
  color: var(--rd-muted);
  font-size: 10px;
  font-weight: 850;
}
.saved-remove-dialog footer .is-danger {
  border-color: #df294d;
  background: #df294d;
  color: #fff;
}
.saved-toast {
  position: fixed;
  z-index: 1100;
  top: 18px;
  right: 18px;
  display: grid;
  width: min(390px, calc(100vw - 28px));
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  border: 1px solid;
  border-radius: 13px;
  padding: 12px 13px;
  box-shadow: 0 20px 45px -28px rgba(7, 17, 31, 0.75);
  font-size: 11px;
}
.saved-toast.is-success {
  border-color: #a9dfc5;
  background: #ecfdf3;
  color: #137a48;
}
.saved-toast.is-error {
  border-color: #f0b4c1;
  background: #fff1f3;
  color: #ce294c;
}
.saved-toast > ion-icon {
  font-size: 20px;
}
.saved-toast button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 8px;
  color: currentColor;
}

.saved-nav__link:focus-visible,
.saved-account:focus-visible,
.sort-control:focus-within,
.filter-trigger:focus-visible,
.saved-property-card a:focus-visible,
.saved-property-card button:focus-visible,
.saved-mobile-list a:focus-visible,
.saved-mobile-list button:focus-visible,
.saved-state-card button:focus-visible,
.saved-empty-state a:focus-visible,
.saved-discovery-banner a:focus-visible,
.saved-filter-dialog button:focus-visible,
.saved-remove-dialog button:focus-visible {
  outline: 3px solid rgba(23, 105, 239, 0.28);
  outline-offset: 2px;
}

.saved-dialog-enter-active,
.saved-dialog-leave-active,
.saved-toast-enter-active,
.saved-toast-leave-active {
  transition: opacity 200ms ease;
}
.saved-dialog-enter-active .saved-filter-dialog,
.saved-dialog-leave-active .saved-filter-dialog {
  transition: transform 200ms ease;
}
.saved-dialog-enter-from,
.saved-dialog-leave-to,
.saved-toast-enter-from,
.saved-toast-leave-to {
  opacity: 0;
}
.saved-dialog-enter-from .saved-filter-dialog,
.saved-dialog-leave-to .saved-filter-dialog {
  transform: translateX(100%);
}

@keyframes saved-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

@media (min-width: 768px) {
  .saved-main {
    padding: 24px 24px 116px;
  }
  .saved-header-actions {
    display: flex;
  }
  .saved-mobile-controls {
    display: none;
  }
  .saved-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .saved-summary article {
    border-right: 1px solid var(--saved-border);
    border-bottom: 0 !important;
    padding: 19px 18px;
  }
  .saved-summary article:last-child {
    border-right: 0;
  }
  .saved-summary article:nth-child(odd) {
    border-right: 1px solid var(--saved-border);
  }
  .saved-summary__icon {
    width: 45px;
    height: 45px;
    font-size: 23px;
  }
  .saved-skeleton-grid,
  .saved-desktop-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  .sort-control {
    min-width: 196px;
    flex: 0 0 auto;
  }
}

@media (min-width: 1024px) {
  .saved-workspace {
    display: grid;
    grid-template-columns: 214px minmax(0, 1fr);
  }
  .saved-sidebar {
    position: sticky;
    top: 0;
    display: flex;
    height: 100vh;
    flex-direction: column;
    border-right: 1px solid var(--saved-border);
    background: var(--saved-surface);
    padding: 22px 14px;
  }
  .saved-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 9px 18px;
    color: var(--saved-text);
    text-decoration: none;
  }
  .saved-brand > span {
    color: var(--saved-blue);
    font-size: 37px;
    font-weight: 950;
    line-height: 1;
  }
  .saved-brand strong {
    font-size: 18px;
    font-weight: 900;
  }
  .saved-nav {
    display: grid;
    gap: 4px;
    border-top: 1px solid var(--saved-border);
    padding-top: 14px;
  }
  .saved-nav__link {
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
  .saved-nav__link ion-icon {
    font-size: 18px;
  }
  .saved-nav__link:hover {
    background: var(--saved-soft);
    color: var(--saved-blue);
    transform: translateX(2px);
  }
  .saved-nav__link.is-active {
    background: var(--saved-blue);
    color: #fff;
    box-shadow: 0 12px 22px -16px rgba(23, 105, 239, 0.85);
  }
  .saved-account {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    margin-top: auto;
    border: 1px solid var(--saved-border);
    border-radius: 12px;
    padding: 10px;
    color: var(--saved-text);
    text-decoration: none;
  }
  .saved-account > img,
  .saved-account__avatar {
    display: grid;
    width: 36px;
    height: 36px;
    place-items: center;
    object-fit: cover;
    border-radius: 10px;
    background: var(--saved-blue-soft);
    color: var(--saved-blue);
    font-size: 13px;
    font-weight: 900;
  }
  .saved-account__copy {
    min-width: 0;
  }
  .saved-account__copy strong,
  .saved-account__copy small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .saved-account__copy strong {
    font-size: 10px;
  }
  .saved-account__copy small {
    margin-top: 3px;
    color: var(--saved-muted);
    font-size: 8px;
  }
  .saved-account > ion-icon {
    color: var(--saved-muted);
  }
  .saved-main {
    padding: 26px 28px 34px;
  }
  .saved-mobile-nav {
    display: none;
  }
}

@media (min-width: 1440px) {
  .saved-workspace {
    grid-template-columns: 228px minmax(0, 1fr);
  }
  .saved-main {
    padding-inline: 34px;
  }
}

@media (max-width: 767px) {
  .saved-title-row h1 {
    font-size: 26px;
  }
  .saved-title-row > span {
    width: 34px;
    height: 34px;
    font-size: 19px;
  }
  .saved-header > div:first-child > p:last-child {
    font-size: 11px;
  }
  .saved-desktop-grid {
    display: none;
  }
  .saved-skeleton-grid {
    gap: 10px;
  }
  .saved-skeleton {
    display: grid;
    min-height: 145px;
    grid-template-columns: 112px minmax(0, 1fr);
    border-radius: 15px;
  }
  .saved-skeleton__media {
    width: 112px;
    height: 100%;
    aspect-ratio: auto;
  }
  .saved-skeleton > div {
    align-content: center;
    padding: 14px;
  }
  .saved-mobile-list {
    display: grid;
    gap: 10px;
    margin-top: 18px;
  }
  .saved-mobile-list > article {
    display: grid;
    min-width: 0;
    grid-template-columns: 112px minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid var(--saved-border);
    border-radius: 15px;
    background: var(--saved-surface);
    box-shadow: 0 18px 38px -35px rgba(16, 32, 51, 0.65);
  }
  .saved-mobile-item__media {
    display: block;
    width: 112px;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: var(--saved-soft);
  }
  .saved-mobile-item__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .saved-mobile-item__content {
    min-width: 0;
    padding: 12px 11px 8px;
  }
  .saved-mobile-item__heading {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  .saved-mobile-item__heading > a {
    min-width: 0;
    flex: 1 1 auto;
    overflow: hidden;
    color: var(--saved-text);
    font-size: 12px;
    font-weight: 900;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .saved-mobile-item__heading > button {
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--saved-border);
    border-radius: 50%;
    background: var(--saved-surface);
    color: var(--saved-red);
    font-size: 17px;
  }
  .saved-mobile-location {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    margin: 3px 0 0;
    color: var(--saved-muted);
    font-size: 8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .saved-mobile-location ion-icon {
    flex: 0 0 auto;
    color: var(--saved-blue);
  }
  .saved-mobile-price {
    overflow: hidden;
    margin: 8px 0 0;
    font-size: 11px;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .saved-mobile-item__content .saved-badges {
    gap: 5px;
    margin-top: 8px;
  }
  .saved-mobile-item__content .saved-badges span {
    min-height: 21px;
    padding: 0 6px;
    font-size: 7px;
  }
  .saved-mobile-item__footer {
    display: flex;
    min-height: 43px;
    grid-column: 1 / -1;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-top: 1px solid var(--saved-border);
    padding: 6px 10px;
    color: var(--saved-muted);
    font-size: 8px;
  }
  .saved-mobile-item__footer button {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    gap: 5px;
    border-radius: 8px;
    background: var(--saved-red-soft);
    padding: 0 9px;
    color: var(--saved-red);
    font-size: 8px;
    font-weight: 850;
  }
  .saved-state-card {
    grid-template-columns: auto minmax(0, 1fr);
    padding: 16px;
  }
  .saved-state-card > button {
    grid-column: 1 / -1;
    width: 100%;
  }
  .saved-discovery-banner {
    grid-template-columns: auto minmax(0, 1fr);
    padding: 16px;
  }
  .saved-discovery-banner > a {
    grid-column: 1 / -1;
    width: 100%;
  }
  .saved-filter-dialog {
    align-self: flex-end;
    width: 100%;
    height: auto;
    max-height: 92vh;
    border: 0;
    border-radius: 18px 18px 0 0;
  }
  .saved-dialog-backdrop {
    align-items: flex-end;
  }
  .saved-dialog-backdrop.is-centered {
    align-items: center;
  }
  .saved-dialog-enter-from .saved-filter-dialog,
  .saved-dialog-leave-to .saved-filter-dialog {
    transform: translateY(100%);
  }
  .saved-toast {
    top: 12px;
    right: 14px;
  }
}

@media (max-width: 390px) {
  .saved-main {
    padding-inline: 10px;
  }
  .saved-summary article {
    gap: 8px;
    padding-inline: 9px;
  }
  .saved-summary__icon {
    width: 35px;
    height: 35px;
    font-size: 18px;
  }
  .saved-summary article strong {
    font-size: 17px;
  }
  .saved-mobile-list > article {
    grid-template-columns: 98px minmax(0, 1fr);
  }
  .saved-mobile-item__media {
    width: 98px;
  }
  .filter-trigger {
    padding-inline: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .saved-property-card,
  .saved-property-card img,
  .saved-heart-button,
  .saved-nav__link,
  .saved-property-card__footer ion-icon,
  .saved-dialog-enter-active,
  .saved-dialog-leave-active,
  .saved-toast-enter-active,
  .saved-toast-leave-active,
  .saved-skeleton__media,
  .saved-skeleton > div span {
    animation: none !important;
    transition: none !important;
  }
}

:global(.dark) .saved-filter-dialog,
:global(.dark) .saved-remove-dialog {
  border-color: #27364a;
  background: #101b2b;
  color: var(--rd-surface-alt);
}
:global(.dark) .saved-filter-dialog > header,
:global(.dark) .saved-filter-dialog > footer {
  border-color: #27364a;
}
:global(.dark) .saved-filter-dialog > header button {
  background: #152236;
  color: #b0bdcd;
}
:global(.dark) .saved-filter-fields > label > span,
:global(.dark) .saved-price-filter > span {
  color: #dbe5f1;
}
:global(.dark) .saved-filter-fields select,
:global(.dark) .saved-filter-fields input {
  border-color: #33445a;
  background: #0c1726;
  color: var(--rd-surface-alt);
  color-scheme: dark;
}
:global(.dark) .saved-remove-dialog p {
  color: #b0bdcd;
}
:global(.dark) .saved-remove-dialog > strong {
  color: #dbe5f1;
}
</style>
