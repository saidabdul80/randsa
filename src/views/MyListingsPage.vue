<template>
  <AppShell :show-header="false" content-class="min-h-full w-full pb-28 lg:pb-0">
    <div class="my-listings-page">
      <NotificationSidebarNav
        :can-manage-properties="canManageProperties"
        :show-mobile="false"
        aria-label="My Listings navigation"
      />

      <main>
        <header class="my-listings-hero">
          <div>
            <p>RANDSA / MY LISTINGS</p>
            <h1>Manage your listings</h1>
            <span>Review, update, pause, complete, or repost the listings you own.</span>
          </div>
          <RouterLink to="/post-listing">
            <IonIcon :icon="addCircleOutline" aria-hidden="true" /> Post Listing
          </RouterLink>
        </header>

        <section class="listing-stats" aria-label="Listing summary">
          <div>
            <IonIcon :icon="albumsOutline" aria-hidden="true" /><span
              ><strong>{{ items.length }}</strong
              >Total</span
            >
          </div>
          <div>
            <IonIcon :icon="checkmarkCircleOutline" aria-hidden="true" /><span
              ><strong>{{ activeCount }}</strong
              >Active</span
            >
          </div>
          <div>
            <IonIcon :icon="timeOutline" aria-hidden="true" /><span
              ><strong>{{ reviewCount }}</strong
              >In review</span
            >
          </div>
          <div>
            <IonIcon :icon="eyeOutline" aria-hidden="true" /><span
              ><strong>{{ totalViews }}</strong
              >Views</span
            >
          </div>
        </section>

        <div class="listing-toolbar">
          <div role="tablist" aria-label="Filter your listings">
            <button
              v-for="filter in filters"
              :key="filter.value"
              type="button"
              :class="{ active: statusFilter === filter.value }"
              @click="statusFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
          <span v-if="isLoading"
            ><IonIcon :icon="syncOutline" class="spin" aria-hidden="true" /> Refreshing</span
          >
        </div>

        <p v-if="errorMessage || listingsError" class="listing-error" role="alert">
          {{ errorMessage || listingsError }}
        </p>

        <section v-if="filteredItems.length" class="listing-grid" aria-label="Your listings">
          <article
            v-for="item in filteredItems"
            :key="`${item.source}:${item.id}`"
            class="listing-card"
          >
            <figure>
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.title"
                loading="lazy"
                decoding="async"
              />
              <span v-else><IonIcon :icon="imagesOutline" aria-hidden="true" /></span>
              <b :class="`status-${item.status}`">{{ statusLabel(item.status) }}</b>
            </figure>
            <div class="listing-card__body">
              <p>{{ item.category }}</p>
              <h2>{{ item.title }}</h2>
              <span
                ><IonIcon :icon="locationOutline" aria-hidden="true" />
                {{ item.location || 'Location not added' }}</span
              >
              <strong>{{ item.price }}</strong>
              <div class="listing-card__performance">
                <span
                  ><IonIcon :icon="eyeOutline" aria-hidden="true" /> {{ item.views }} views</span
                >
                <span
                  ><IonIcon :icon="heartOutline" aria-hidden="true" />
                  {{ item.favourites }} saves</span
                >
              </div>
            </div>
            <footer>
              <RouterLink v-if="item.source === 'property'" :to="`/properties/${item.id}`"
                ><IonIcon :icon="eyeOutline" aria-hidden="true" /> View</RouterLink
              >
              <RouterLink v-else :to="`/listings/${item.id}`"
                ><IonIcon :icon="eyeOutline" aria-hidden="true" /> View</RouterLink
              >
              <RouterLink
                :to="
                  item.source === 'property'
                    ? `/edit-property/${item.id}`
                    : `/edit-listing/${item.id}`
                "
                ><IonIcon :icon="createOutline" aria-hidden="true" /> Edit</RouterLink
              >
              <select
                v-if="item.source === 'listing'"
                :aria-label="`Manage ${item.title}`"
                value=""
                @change="handleAction(item, $event)"
              >
                <option value="" disabled>Manage</option>
                <option v-if="item.status === 'active'" value="paused">Pause</option>
                <option v-if="['active', 'paused'].includes(item.status)" value="sold">
                  Mark sold
                </option>
                <option v-if="['active', 'paused'].includes(item.status)" value="rented">
                  Mark rented
                </option>
                <option v-if="['active', 'paused'].includes(item.status)" value="completed">
                  Mark completed
                </option>
                <option
                  v-if="
                    ['paused', 'sold', 'rented', 'completed', 'rejected', 'expired'].includes(
                      item.status
                    )
                  "
                  value="pending_review"
                >
                  Repost for review
                </option>
                <option value="delete">Delete</option>
              </select>
            </footer>
          </article>
        </section>

        <section v-else-if="!isLoading" class="listing-empty">
          <IonIcon :icon="albumsOutline" aria-hidden="true" />
          <h2>{{ items.length ? 'No listings match this filter' : 'No listings yet' }}</h2>
          <p>
            {{
              items.length
                ? 'Choose another status to see more listings.'
                : 'Your properties, items, services, and opportunities will appear here.'
            }}
          </p>
          <RouterLink v-if="!items.length" to="/post-listing">Post your first listing</RouterLink>
        </section>
      </main>
    </div>

    <div
      v-if="selectedItem"
      class="listing-modal"
      role="presentation"
      @click.self="selectedItem = null"
    >
      <section role="dialog" aria-modal="true" aria-labelledby="listing-modal-title">
        <button
          type="button"
          aria-label="Close listing preview"
          title="Close"
          @click="selectedItem = null"
        >
          <IonIcon :icon="closeOutline" />
        </button>
        <img v-if="selectedItem.image" :src="selectedItem.image" :alt="selectedItem.title" />
        <p>{{ selectedItem.category }} · {{ statusLabel(selectedItem.status) }}</p>
        <h2 id="listing-modal-title">{{ selectedItem.title }}</h2>
        <span
          ><IonIcon :icon="locationOutline" aria-hidden="true" /> {{ selectedItem.location }}</span
        >
        <strong>{{ selectedItem.price }}</strong>
        <div>
          <span>{{ selectedItem.views }} views</span
          ><span>{{ selectedItem.favourites }} saves</span>
        </div>
        <RouterLink :to="`/edit-listing/${selectedItem.id}`">Edit listing</RouterLink>
      </section>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  addCircleOutline,
  albumsOutline,
  checkmarkCircleOutline,
  closeOutline,
  createOutline,
  eyeOutline,
  heartOutline,
  imagesOutline,
  locationOutline,
  syncOutline,
  timeOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import { useAuth } from '../composables/useAuth'
import { useListings } from '../composables/useListings'
import { useProperties } from '../composables/useProperties'
import type { ListingStatus } from '../types/listing'

type ManageStatus = ListingStatus | 'approved' | 'pending'
interface ManageItem {
  id: string
  source: 'listing' | 'property'
  title: string
  category: string
  location: string
  price: string
  image: string
  status: ManageStatus
  views: number
  favourites: number
}

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
const statusFilter = ref('all')
const errorMessage = ref('')
const selectedItem = ref<ManageItem | null>(null)
const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'review', label: 'In review' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
]

const formatMoney = (amount: number, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    amount
  )
const formatLocation = (parts: readonly string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, values) => values.indexOf(part) === index)
    .join(', ')
const listingItems = computed<ManageItem[]>(() =>
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
  }))
)
const propertyItems = computed<ManageItem[]>(() =>
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
const filteredItems = computed(() =>
  items.value.filter((item) => {
    if (statusFilter.value === 'all') return true
    if (statusFilter.value === 'active') return ['active', 'approved'].includes(item.status)
    if (statusFilter.value === 'review')
      return ['pending_review', 'pending', 'rejected'].includes(item.status)
    if (statusFilter.value === 'completed')
      return ['sold', 'rented', 'completed'].includes(item.status)
    return item.status === statusFilter.value
  })
)

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

function statusLabel(status: ManageStatus) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
async function handleAction(item: ManageItem, event: Event) {
  const select = event.target as HTMLSelectElement
  const action = select.value
  select.value = ''
  if (!state.profile || item.source !== 'listing' || !action) return
  errorMessage.value = ''
  try {
    if (action === 'delete') {
      if (!window.confirm(`Delete "${item.title}" permanently?`)) return
      await remove(item.id, state.profile)
    } else {
      await changeStatus(item.id, state.profile, action as ListingStatus)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not update this listing.'
  }
}
</script>

<style scoped>
.my-listings-page {
  min-height: 100%;
  background: #f5f6f8;
  color: #102033;
  padding: 12px;
}
.my-listings-page > main {
  min-width: 0;
}
.my-listings-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid #e0e7ef;
  border-radius: 16px;
  background: #fff;
  padding: 22px;
}
.my-listings-hero p,
.my-listings-hero h1 {
  margin: 0;
}
.my-listings-hero p {
  color: #1769ef;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.12em;
}
.my-listings-hero h1 {
  margin-top: 5px;
  font-size: 28px;
}
.my-listings-hero span {
  display: block;
  margin-top: 7px;
  color: #687b91;
  font-size: 11px;
}
.my-listings-hero > a,
.listing-empty a {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  background: #1769ef;
  padding: 0 14px;
  color: #fff;
  font-size: 10px;
  font-weight: 850;
  text-decoration: none;
}
.listing-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.listing-stats > div {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e1e7ee;
  border-radius: 13px;
  background: #fff;
  padding: 14px;
}
.listing-stats ion-icon {
  color: #1769ef;
  font-size: 22px;
}
.listing-stats span,
.listing-stats strong {
  display: block;
}
.listing-stats span {
  color: #718399;
  font-size: 8px;
}
.listing-stats strong {
  margin-bottom: 2px;
  color: #102033;
  font-size: 17px;
}
.listing-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 12px;
}
.listing-toolbar > div {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.listing-toolbar button {
  min-height: 34px;
  border: 1px solid #dce4ed;
  border-radius: 8px;
  background: #fff;
  padding: 0 11px;
  color: #536980;
  font-size: 9px;
  font-weight: 800;
}
.listing-toolbar button.active {
  border-color: #1769ef;
  background: #1769ef;
  color: #fff;
}
.listing-toolbar > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #6c8096;
  font-size: 9px;
}
.listing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.listing-card {
  overflow: hidden;
  border: 1px solid #e0e7ef;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 20px 42px -38px rgba(16, 32, 51, 0.6);
}
.listing-card figure {
  position: relative;
  display: grid;
  height: 170px;
  margin: 0;
  place-items: center;
  background: #eaf0f6;
  color: #7c8da1;
}
.listing-card figure img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.listing-card figure > span ion-icon {
  font-size: 30px;
}
.listing-card figure b {
  position: absolute;
  top: 9px;
  right: 9px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.92);
  padding: 5px 8px;
  color: #b45309;
  font-size: 7px;
  backdrop-filter: blur(8px);
}
.listing-card figure b.status-active,
.listing-card figure b.status-approved {
  color: #07834d;
}
.listing-card figure b.status-rejected {
  color: #dc2626;
}
.listing-card__body {
  display: grid;
  gap: 5px;
  padding: 14px;
}
.listing-card__body p,
.listing-card__body h2 {
  margin: 0;
}
.listing-card__body p {
  color: #1769ef;
  font-size: 8px;
  font-weight: 850;
  text-transform: uppercase;
}
.listing-card__body h2 {
  overflow: hidden;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.listing-card__body > span {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  color: #6d8096;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.listing-card__body > strong {
  margin-top: 4px;
  color: #079455;
  font-size: 14px;
}
.listing-card__performance {
  display: flex;
  gap: 13px;
  margin-top: 7px;
  color: #718399;
  font-size: 8px;
}
.listing-card__performance span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.listing-card footer {
  display: flex;
  align-items: center;
  gap: 5px;
  border-top: 1px solid #edf1f5;
  padding: 10px;
}
.listing-card footer a,
.listing-card footer button,
.listing-card footer select {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #dce4ed;
  border-radius: 8px;
  background: #fff;
  padding: 0 9px;
  color: #40576f;
  font: inherit;
  font-size: 8px;
  font-weight: 800;
  text-decoration: none;
}
.listing-card footer select {
  margin-left: auto;
}
.listing-empty {
  display: grid;
  min-height: 300px;
  place-content: center;
  justify-items: center;
  border: 1px dashed #cad7e5;
  border-radius: 15px;
  background: #fff;
  padding: 24px;
  text-align: center;
}
.listing-empty > ion-icon {
  color: #1769ef;
  font-size: 36px;
}
.listing-empty h2 {
  margin: 10px 0 0;
  font-size: 18px;
}
.listing-empty p {
  max-width: 360px;
  margin: 7px 0 15px;
  color: #718399;
  font-size: 10px;
  line-height: 1.6;
}
.listing-error {
  border: 1px solid #fecdd3;
  border-radius: 9px;
  background: #fff1f2;
  padding: 10px 12px;
  color: #be123c;
  font-size: 9px;
}
.listing-modal {
  position: fixed;
  z-index: 80;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.48);
  padding: 18px;
  backdrop-filter: blur(5px);
}
.listing-modal > section {
  position: relative;
  width: min(100%, 460px);
  border-radius: 15px;
  background: #fff;
  padding: 18px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25);
}
.listing-modal > section > button {
  position: absolute;
  z-index: 2;
  top: 10px;
  right: 10px;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
}
.listing-modal img {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 10px;
  object-fit: cover;
}
.listing-modal p {
  margin: 13px 0 0;
  color: #1769ef;
  font-size: 8px;
  font-weight: 850;
  text-transform: uppercase;
}
.listing-modal h2 {
  margin: 5px 0;
}
.listing-modal section > span {
  display: flex;
  gap: 5px;
  color: #6d8096;
  font-size: 10px;
}
.listing-modal section > strong {
  display: block;
  margin-top: 10px;
  color: #079455;
}
.listing-modal section > div {
  display: flex;
  gap: 12px;
  margin-top: 10px;
  color: #718399;
  font-size: 9px;
}
.listing-modal section > a {
  display: inline-flex;
  margin-top: 14px;
  border-radius: 8px;
  background: #1769ef;
  padding: 9px 12px;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  text-decoration: none;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (min-width: 1024px) {
  .my-listings-page {
    display: grid;
    grid-template-columns: 205px minmax(0, 1fr);
    gap: 18px;
    padding: 14px 18px 26px;
  }
}
@media (max-width: 900px) {
  .listing-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .my-listings-hero {
    align-items: flex-start;
    padding: 17px;
  }
  .my-listings-hero h1 {
    font-size: 23px;
  }
  .my-listings-hero > a {
    min-height: 36px;
    padding-inline: 10px;
  }
  .listing-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .listing-grid {
    grid-template-columns: 1fr;
  }
}
:global(.dark) .my-listings-page {
  background: #0b1420;
  color: #f8fafc;
}
:global(.dark) .my-listings-hero,
:global(.dark) .listing-stats > div,
:global(.dark) .listing-card,
:global(.dark) .listing-empty,
:global(.dark) .listing-toolbar button,
:global(.dark) .listing-card footer a,
:global(.dark) .listing-card footer button,
:global(.dark) .listing-card footer select {
  border-color: #2a394b;
  background: #111c2a;
  color: #e8eef6;
}
:global(.dark) .my-listings-hero h1,
:global(.dark) .listing-stats strong,
:global(.dark) .listing-card__body h2 {
  color: #f8fafc;
}
</style>
