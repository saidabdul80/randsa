<template>
  <AppShell
    :show-header="false"
    :bottom-nav-mobile-only="true"
    content-class="min-h-full w-full pb-28 lg:pb-0"
  >
    <div class="my-listings-page">
      <NotificationSidebarNav
        :can-manage-properties="canManageProperties"
        :show-mobile="false"
        aria-label="My Listings navigation"
      />

      <main class="my-listings-main">
        <header class="my-listings-hero">
          <div class="my-listings-hero__copy">
            <p>RANDSA / MY LISTINGS</p>
            <h1>Manage your listings</h1>
            <span>Review, update, pause, complete, or repost the listings you own.</span>
          </div>
          <RouterLink class="post-listing-button" to="/post-listing">
            <IonIcon :icon="addOutline" aria-hidden="true" />
            Post Listing
          </RouterLink>
        </header>

        <section class="listing-stats" aria-label="Listing summary">
          <article
            v-for="card in summaryCards"
            :key="card.label"
            class="listing-stat-card"
            :class="`listing-stat-card--${card.tone}`"
          >
            <span class="listing-stat-card__icon">
              <IonIcon :icon="card.icon" aria-hidden="true" />
            </span>
            <span class="listing-stat-card__copy">
              <strong>{{ card.value }}</strong>
              <span>{{ card.label }}</span>
            </span>
          </article>
        </section>

        <section class="listing-controls" aria-label="Listing filters and search">
          <div class="listing-status-tabs" role="tablist" aria-label="Filter your listings">
            <button
              v-for="filter in filters"
              :key="filter.value"
              type="button"
              role="tab"
              :aria-selected="statusFilter === filter.value"
              :class="{ active: statusFilter === filter.value }"
              @click="statusFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>

          <div class="listing-search-tools">
            <label class="listing-search">
              <IonIcon :icon="searchOutline" aria-hidden="true" />
              <span class="sr-only">Search your listings</span>
              <input
                v-model.trim="searchQuery"
                type="search"
                placeholder="Search your listings..."
              />
              <button
                v-if="searchQuery"
                type="button"
                aria-label="Clear listing search"
                title="Clear search"
                @click="searchQuery = ''"
              >
                <IonIcon :icon="closeOutline" aria-hidden="true" />
              </button>
            </label>

            <details class="listings-sort">
              <summary aria-label="Sort listings" title="Sort listings">
                <IonIcon :icon="optionsOutline" aria-hidden="true" />
              </summary>
              <div role="menu" aria-label="Sort order">
                <button
                  v-for="option in sortOptions"
                  :key="option.value"
                  type="button"
                  role="menuitemradio"
                  :aria-checked="sortOrder === option.value"
                  :class="{ active: sortOrder === option.value }"
                  @click="setSortOrder(option.value, $event)"
                >
                  {{ option.label }}
                  <IonIcon
                    v-if="sortOrder === option.value"
                    :icon="checkmarkOutline"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </details>
          </div>
        </section>

        <p v-if="errorMessage || listingsError" class="listing-error" role="alert">
          <IonIcon :icon="alertCircleOutline" aria-hidden="true" />
          {{ errorMessage || listingsError }}
        </p>

        <section v-if="isLoading" class="listing-grid" aria-label="Loading your listings">
          <ListingCardSkeleton v-for="index in 3" :key="index" />
        </section>

        <section
          v-else-if="visibleItems.length"
          class="listing-grid"
          aria-label="Your listings"
          aria-live="polite"
        >
          <MyListingCard
            v-for="item in visibleItems"
            :key="`${item.source}:${item.id}`"
            :item="item"
            :busy="busyItemId === `${item.source}:${item.id}`"
            @action="handleAction(item, $event)"
          />
        </section>

        <section v-else class="listing-empty">
          <span class="listing-empty__icon">
            <IonIcon :icon="albumsOutline" aria-hidden="true" />
          </span>
          <h2>{{ emptyStateTitle }}</h2>
          <p>{{ emptyStateDescription }}</p>
          <RouterLink v-if="!items.length" to="/post-listing">
            <IonIcon :icon="addOutline" aria-hidden="true" />
            Post your first listing
          </RouterLink>
          <button v-else type="button" @click="resetFilters">Show all listings</button>
        </section>

        <footer v-if="!isLoading && visibleItems.length" class="listing-results">
          Showing 1 to {{ visibleItems.length }} of {{ visibleItems.length }}
          {{ visibleItems.length === 1 ? 'listing' : 'listings' }}
        </footer>
      </main>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  addOutline,
  albumsOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  closeOutline,
  eyeOutline,
  optionsOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton.vue'
import MyListingCard from '../components/listings/MyListingCard.vue'
import {
  listingStatusLabel,
  type ManageListingAction,
  type ManageListingItem,
} from '../components/listings/manageListing'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import { useAuth } from '../composables/useAuth'
import { useListings } from '../composables/useListings'
import { useProperties } from '../composables/useProperties'
import type { ListingStatus } from '../types/listing'

type StatusFilter = 'all' | 'active' | 'review' | 'paused' | 'completed'
type SortOrder = 'updated-desc' | 'updated-asc' | 'views-desc'

const { state, canManageProperties } = useAuth()
const {
  ownedListings,
  isLoading: listingsLoading,
  error: listingsError,
  refreshOwned,
  changeStatus,
  remove,
} = useListings()
const { properties, isLoading: propertiesLoading, refresh: refreshProperties } = useProperties()

const statusFilter = ref<StatusFilter>('all')
const searchQuery = ref('')
const sortOrder = ref<SortOrder>('updated-desc')
const errorMessage = ref('')
const busyItemId = ref('')

const filters: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'review', label: 'In review' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
]

const sortOptions: ReadonlyArray<{ value: SortOrder; label: string }> = [
  { value: 'updated-desc', label: 'Newest updated' },
  { value: 'updated-asc', label: 'Oldest updated' },
  { value: 'views-desc', label: 'Most viewed' },
]

const formatMoney = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

const formatLocation = (parts: readonly string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, values) => values.indexOf(part) === index)
    .join(', ')

function updatedLabel(value: string) {
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'Updated recently'

  const elapsed = Math.max(0, Date.now() - timestamp)
  const minutes = Math.floor(elapsed / 60_000)
  const hours = Math.floor(elapsed / 3_600_000)
  const days = Math.floor(elapsed / 86_400_000)

  if (minutes < 1) return 'Updated just now'
  if (minutes < 60) return `Updated ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  if (hours < 24) return `Updated ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  if (days < 7) return `Updated ${days} ${days === 1 ? 'day' : 'days'} ago`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `Updated ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`

  const months = Math.floor(days / 30)
  return `Updated ${months} ${months === 1 ? 'month' : 'months'} ago`
}

const listingItems = computed<ManageListingItem[]>(() =>
  ownedListings.value.map((item) => ({
    id: item.id,
    source: 'listing',
    title: item.title,
    category: item.subcategoryName || item.categoryName,
    location: formatLocation([item.location.area, item.location.city, item.location.state]),
    price: ['free', 'contact'].includes(item.pricing.priceType)
      ? item.pricing.priceType === 'free'
        ? 'Free'
        : 'Contact for price'
      : `${formatMoney(item.pricing.amount, item.pricing.currency)}${item.pricing.billingPeriod ? ` / ${item.pricing.billingPeriod}` : ''}`,
    image: item.media.coverImage,
    status: item.status,
    views: item.viewCount,
    favourites: item.favouriteCount,
    mediaCount: Math.max(item.media.images.length, item.media.coverImage ? 1 : 0),
    updatedAt: item.updatedAt,
    updatedLabel: updatedLabel(item.updatedAt),
  }))
)

const propertyItems = computed<ManageListingItem[]>(() =>
  properties.value
    .filter((property) => property.ownerId === state.profile?.uid)
    .map((property) => ({
      id: property.id,
      source: 'property',
      title: property.title,
      category: property.propertyType,
      location: formatLocation([property.area, property.city, property.state]),
      price: `${formatMoney(property.rentPrice)} / ${property.paymentDuration}`,
      image: property.images[0] ?? '',
      status: property.status,
      views: 0,
      favourites: 0,
      mediaCount: property.images.length,
      updatedAt: property.updatedAt,
      updatedLabel: updatedLabel(property.updatedAt),
    }))
)

const items = computed(() => [...listingItems.value, ...propertyItems.value])
const isLoading = computed(() => listingsLoading.value || propertiesLoading.value)
const activeCount = computed(
  () => items.value.filter((item) => ['active', 'approved'].includes(item.status)).length
)
const reviewCount = computed(
  () => items.value.filter((item) => ['pending_review', 'pending'].includes(item.status)).length
)
const totalViews = computed(() => items.value.reduce((total, item) => total + item.views, 0))

const summaryCards = computed(() => [
  { label: 'Total Listings', value: items.value.length, icon: albumsOutline, tone: 'total' },
  { label: 'Active', value: activeCount.value, icon: checkmarkCircleOutline, tone: 'active' },
  { label: 'In Review', value: reviewCount.value, icon: timeOutline, tone: 'review' },
  { label: 'Views', value: totalViews.value, icon: eyeOutline, tone: 'views' },
])

const visibleItems = computed(() => {
  const query = searchQuery.value.toLocaleLowerCase()
  const matching = items.value.filter((item) => {
    const statusMatches =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && ['active', 'approved'].includes(item.status)) ||
      (statusFilter.value === 'review' && ['pending_review', 'pending'].includes(item.status)) ||
      (statusFilter.value === 'completed' &&
        ['sold', 'rented', 'completed'].includes(item.status)) ||
      item.status === statusFilter.value

    if (!statusMatches) return false
    if (!query) return true

    return [item.title, item.category, item.location, item.price, listingStatusLabel(item.status)]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })

  return [...matching].sort((left, right) => {
    if (sortOrder.value === 'views-desc') return right.views - left.views
    const leftTime = new Date(left.updatedAt).getTime() || 0
    const rightTime = new Date(right.updatedAt).getTime() || 0
    return sortOrder.value === 'updated-asc' ? leftTime - rightTime : rightTime - leftTime
  })
})

const emptyStateTitle = computed(() => {
  if (!items.value.length) return 'No listings yet'
  if (searchQuery.value) return 'No matching listings'
  const selected = filters
    .find((filter) => filter.value === statusFilter.value)
    ?.label.toLowerCase()
  return `No ${selected ?? 'matching'} listings`
})

const emptyStateDescription = computed(() => {
  if (!items.value.length)
    return 'Your properties, items, services, and opportunities will appear here.'
  if (searchQuery.value) return 'Try another search term or clear the current filters.'
  return `Listings with this status will appear here when they are available.`
})

watch(
  () => state.profile?.uid,
  async (uid) => {
    if (!uid) return
    errorMessage.value = ''
    try {
      await Promise.all([refreshOwned(uid), refreshProperties()])
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Could not load your listings.'
    }
  },
  { immediate: true }
)

function setSortOrder(value: SortOrder, event: Event) {
  sortOrder.value = value
  ;(event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open')
}

function resetFilters() {
  statusFilter.value = 'all'
  searchQuery.value = ''
}

async function handleAction(item: ManageListingItem, action: ManageListingAction) {
  if (!state.profile || item.source !== 'listing' || !action) return
  if (action === 'delete' && !window.confirm(`Delete "${item.title}" permanently?`)) return

  errorMessage.value = ''
  busyItemId.value = `${item.source}:${item.id}`
  try {
    if (action === 'delete') {
      await remove(item.id, state.profile)
    } else {
      await changeStatus(item.id, state.profile, action as ListingStatus)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not update this listing.'
  } finally {
    busyItemId.value = ''
  }
}
</script>

<style scoped>
.my-listings-page {
  min-height: 100%;
  background: #f5f6f8;
  color: #102033;
  padding: clamp(12px, 1.5vw, 24px);
}

.my-listings-main {
  min-width: 0;
  max-width: 1500px;
}

.my-listings-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 6px 2px 20px;
}

.my-listings-hero__copy p,
.my-listings-hero__copy h1 {
  margin: 0;
}

.my-listings-hero__copy p {
  color: #3157d8;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.my-listings-hero__copy h1 {
  margin-top: 8px;
  color: #102033;
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 760;
  line-height: 1.08;
}

.my-listings-hero__copy span {
  display: block;
  margin-top: 10px;
  color: #65788f;
  font-size: 13px;
  line-height: 1.55;
}

.post-listing-button,
.listing-empty a,
.listing-empty button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid #1769ef;
  border-radius: 11px;
  background: #1769ef;
  padding: 0 17px;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 850;
  text-decoration: none;
  box-shadow: 0 12px 24px -15px rgba(23, 105, 239, 0.72);
  transition:
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.post-listing-button:hover,
.listing-empty a:hover,
.listing-empty button:hover {
  background: #0d5cdf;
  box-shadow: 0 17px 30px -17px rgba(23, 105, 239, 0.8);
  transform: translateY(-2px);
}

.post-listing-button:focus-visible,
.listing-empty a:focus-visible,
.listing-empty button:focus-visible {
  outline: 3px solid rgba(23, 105, 239, 0.22);
  outline-offset: 3px;
}

.listing-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.listing-stat-card {
  display: flex;
  min-width: 0;
  min-height: 104px;
  align-items: center;
  gap: 15px;
  border: 1px solid #e0e6ee;
  border-radius: 15px;
  background: #fff;
  padding: 17px;
  box-shadow: 0 15px 34px -31px rgba(16, 32, 51, 0.58);
}

.listing-stat-card__icon {
  display: grid;
  width: 50px;
  height: 50px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  background: #eef3ff;
  color: #3157d8;
  font-size: 24px;
}

.listing-stat-card--active .listing-stat-card__icon {
  background: #e9f9ef;
  color: #0b9554;
}

.listing-stat-card--review .listing-stat-card__icon {
  background: #fff6e5;
  color: #e0790c;
}

.listing-stat-card--views .listing-stat-card__icon {
  background: #edf2ff;
  color: #5264e7;
}

.listing-stat-card__copy,
.listing-stat-card__copy strong,
.listing-stat-card__copy > span {
  display: block;
  min-width: 0;
}

.listing-stat-card__copy strong {
  color: #102033;
  font-size: 25px;
  font-weight: 800;
  line-height: 1;
}

.listing-stat-card__copy > span {
  margin-top: 7px;
  color: #718399;
  font-size: 11px;
  font-weight: 650;
}

.listing-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 26px 0 20px;
}

.listing-status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.listing-status-tabs button {
  min-height: 42px;
  border: 1px solid #dce4ed;
  border-radius: 10px;
  background: #fff;
  padding: 0 15px;
  color: #536980;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.listing-status-tabs button:hover {
  border-color: #b8c7da;
  color: #1769ef;
  transform: translateY(-1px);
}

.listing-status-tabs button.active {
  border-color: #1769ef;
  background: #1769ef;
  color: #fff;
  box-shadow: 0 9px 20px -14px rgba(23, 105, 239, 0.8);
}

.listing-status-tabs button:focus-visible,
.listing-search:focus-within,
.listings-sort summary:focus-visible {
  outline: 3px solid rgba(23, 105, 239, 0.2);
  outline-offset: 2px;
}

.listing-search-tools {
  display: flex;
  flex: 0 1 390px;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.listing-search {
  display: flex;
  min-width: 0;
  height: 46px;
  flex: 1;
  align-items: center;
  gap: 10px;
  border: 1px solid #dce4ed;
  border-radius: 11px;
  background: #fff;
  padding: 0 13px;
  color: #667b92;
  transition: border-color 180ms ease;
}

.listing-search:focus-within {
  border-color: #1769ef;
}

.listing-search > ion-icon {
  flex: 0 0 auto;
  font-size: 19px;
}

.listing-search input {
  min-width: 0;
  height: 100%;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #102033;
  font: inherit;
  font-size: 12px;
}

.listing-search input::placeholder {
  color: #8798ab;
}

.listing-search input::-webkit-search-cancel-button {
  display: none;
}

.listing-search button {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: #f0f4f8;
  color: #58708a;
  cursor: pointer;
}

.listings-sort {
  position: relative;
  z-index: 20;
  flex: 0 0 auto;
}

.listings-sort summary {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border: 1px solid #dce4ed;
  border-radius: 11px;
  background: #fff;
  color: #526b86;
  cursor: pointer;
  font-size: 20px;
  list-style: none;
}

.listings-sort summary::-webkit-details-marker {
  display: none;
}

.listings-sort[open] summary,
.listings-sort summary:hover {
  border-color: #aac0de;
  color: #1769ef;
}

.listings-sort > div {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  width: 170px;
  border: 1px solid #dce4ed;
  border-radius: 11px;
  background: #fff;
  padding: 6px;
  box-shadow: 0 18px 45px -20px rgba(15, 23, 42, 0.38);
}

.listings-sort > div button {
  display: flex;
  min-height: 38px;
  align-items: center;
  justify-content: space-between;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 0 10px;
  color: #40566f;
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  text-align: left;
}

.listings-sort > div button:hover,
.listings-sort > div button.active {
  background: #f1f5fb;
  color: #1769ef;
}

.listing-grid {
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 18px;
}

.listing-error {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fecdd3;
  border-radius: 11px;
  background: #fff1f2;
  padding: 12px 14px;
  color: #be123c;
  font-size: 11px;
}

.listing-error ion-icon {
  flex: 0 0 auto;
  font-size: 18px;
}

.listing-empty {
  display: grid;
  min-height: 330px;
  place-content: center;
  justify-items: center;
  border: 1px dashed #c8d5e3;
  border-radius: 16px;
  background: #fff;
  padding: 28px;
  text-align: center;
}

.listing-empty__icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 15px;
  background: #eef3ff;
  color: #1769ef;
  font-size: 29px;
}

.listing-empty h2 {
  margin: 17px 0 0;
  color: #102033;
  font-size: 20px;
}

.listing-empty p {
  max-width: 390px;
  margin: 8px 0 18px;
  color: #718399;
  font-size: 12px;
  line-height: 1.65;
}

.listing-empty button {
  border-color: #d7e1ec;
  background: #fff;
  color: #1769ef;
  box-shadow: none;
}

.listing-results {
  margin-top: 26px;
  border-top: 1px solid #e1e7ee;
  padding: 20px 2px 4px;
  color: #687c92;
  font-size: 11px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

@media (min-width: 700px) {
  .listing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 760px) {
  .listing-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .my-listings-page {
    display: grid;
    grid-template-columns: 218px minmax(0, 1fr);
    gap: clamp(20px, 2vw, 30px);
  }
}

@media (min-width: 1180px) {
  .listing-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .listing-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .listing-search-tools {
    flex-basis: auto;
    justify-content: stretch;
  }
}

@media (max-width: 560px) {
  .my-listings-page {
    padding: 12px;
  }

  .my-listings-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 5px 2px 18px;
  }

  .my-listings-hero__copy h1 {
    font-size: 28px;
  }

  .post-listing-button {
    width: 100%;
  }

  .listing-stats {
    gap: 9px;
  }

  .listing-stat-card {
    min-height: 92px;
    gap: 10px;
    padding: 13px;
  }

  .listing-stat-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 11px;
    font-size: 20px;
  }

  .listing-stat-card__copy strong {
    font-size: 21px;
  }

  .listing-status-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .listing-status-tabs button {
    min-height: 40px;
    padding: 0 8px;
  }

  .listing-search-tools {
    width: 100%;
  }
}

:global(.dark) .my-listings-page {
  background: #0b1420;
  color: #f8fafc;
}

:global(.dark) .my-listings-hero__copy h1,
:global(.dark) .listing-stat-card__copy strong,
:global(.dark) .listing-empty h2 {
  color: #f8fafc;
}

:global(.dark) .listing-stat-card,
:global(.dark) .listing-search,
:global(.dark) .listing-status-tabs button,
:global(.dark) .listings-sort summary,
:global(.dark) .listings-sort > div,
:global(.dark) .listing-empty {
  border-color: #2c3b4d;
  background: #111c2a;
}

:global(.dark) .listing-search input {
  color: #f8fafc;
}

:global(.dark) .listings-sort > div button {
  color: #d8e2ee;
}

@media (prefers-reduced-motion: reduce) {
  .post-listing-button,
  .listing-empty a,
  .listing-empty button,
  .listing-status-tabs button {
    transition: none;
  }
}
</style>
