<template>
  <AppShell :show-header="false" content-class="min-h-full w-full pb-28 lg:pb-0">
    <div class="listing-details-page">
      <NotificationSidebarNav
        :can-manage-properties="canManageProperties"
        :show-mobile="false"
        aria-label="Marketplace navigation"
      />

      <main>
        <div v-if="isLoading" class="listing-details-state" aria-live="polite">
          <IonSpinner name="crescent" />
          <p>Loading listing...</p>
        </div>

        <section v-else-if="errorMessage || !listing" class="listing-details-state" role="alert">
          <IonIcon :icon="alertCircleOutline" aria-hidden="true" />
          <h1>Listing unavailable</h1>
          <p>{{ errorMessage || 'This listing could not be found.' }}</p>
          <button type="button" @click="loadListing">Try again</button>
          <RouterLink to="/home#listings">Back to listings</RouterLink>
        </section>

        <template v-else-if="item">
          <header class="listing-details-header">
            <RouterLink to="/home#listings">
              <IonIcon :icon="arrowBackOutline" aria-hidden="true" /> Listings
            </RouterLink>
            <div>
              <span>{{ item.categoryName }}</span>
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
              <strong>{{ item.subcategoryName }}</strong>
            </div>
            <RouterLink v-if="canEdit" :to="`/edit-listing/${item.id}`">
              <IonIcon :icon="createOutline" aria-hidden="true" /> Edit listing
            </RouterLink>
          </header>

          <div class="listing-details-content">
            <div class="listing-details-main">
              <section class="listing-gallery" aria-label="Listing photos">
                <img v-if="activeImage" :src="activeImage" :alt="item.title" decoding="async" />
                <div v-else class="listing-gallery__empty">
                  <IonIcon :icon="imagesOutline" aria-hidden="true" />
                  <span>No photo provided</span>
                </div>
                <div v-if="listing.media.images.length > 1" class="listing-gallery__thumbs">
                  <button
                    v-for="(image, index) in listing.media.images"
                    :key="image"
                    type="button"
                    :class="{ active: index === activeImageIndex }"
                    :aria-label="`Show image ${index + 1} of ${listing.media.images.length}`"
                    @click="activeImageIndex = index"
                  >
                    <img :src="image" alt="" loading="lazy" />
                  </button>
                </div>
              </section>

              <section class="listing-summary">
                <div class="listing-summary__badges">
                  <span>{{ item.categoryName }}</span>
                  <span>{{ item.subcategoryName }}</span>
                  <span class="is-active">{{ item.availabilityLabel }}</span>
                </div>
                <h1>{{ item.title }}</h1>
                <p class="listing-summary__location">
                  <IonIcon :icon="locationOutline" aria-hidden="true" />
                  {{ item.location || 'Location not added' }}
                </p>
                <div class="listing-summary__price">
                  <strong>{{ item.price }}</strong>
                  <span v-if="item.paymentDuration">/ {{ item.paymentDuration }}</span>
                </div>
              </section>

              <section class="listing-section">
                <h2>About this listing</h2>
                <p>{{ listing.description }}</p>
              </section>

              <section v-if="hasListingCoordinates" class="listing-location-map">
                <header>
                  <h2>Location map</h2>
                  <p>{{ item.location || 'Pinned listing location' }}</p>
                </header>
                <PropertyMapPreview
                  :latitude="listing.location.latitude"
                  :longitude="listing.location.longitude"
                  :title="listing.title"
                  :price-label="item.price"
                />
              </section>

              <section v-if="attributeRows.length" class="listing-section">
                <h2>Listing details</h2>
                <dl class="listing-attributes">
                  <div v-for="attribute in attributeRows" :key="attribute.label">
                    <dt>{{ attribute.label }}</dt>
                    <dd>{{ attribute.value }}</dd>
                  </div>
                </dl>
              </section>

              <section
                v-if="
                  listing.delivery.available ||
                  listing.delivery.pickupAvailable ||
                  listing.delivery.details
                "
                class="listing-section"
              >
                <h2>Delivery and pickup</h2>
                <div class="listing-delivery">
                  <span v-if="listing.delivery.available">
                    <IonIcon :icon="carOutline" aria-hidden="true" /> Delivery available
                  </span>
                  <span v-if="listing.delivery.pickupAvailable">
                    <IonIcon :icon="storefrontOutline" aria-hidden="true" /> Pickup available
                  </span>
                </div>
                <p v-if="listing.delivery.details">{{ listing.delivery.details }}</p>
              </section>

              <section v-if="listing.media.videoUrl" class="listing-section">
                <h2>Listing video</h2>
                <a :href="listing.media.videoUrl" target="_blank" rel="noopener noreferrer">
                  <IonIcon :icon="playCircleOutline" aria-hidden="true" /> Open video
                </a>
              </section>
            </div>

            <aside class="listing-contact">
              <p>Contact</p>
              <h2>{{ listing.contact.name }}</h2>
              <span>{{ item.categoryName }} listing contact</span>

              <button
                type="button"
                :disabled="isSaving"
                :aria-pressed="isSaved"
                @click="handleSave"
              >
                <IonIcon :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
                {{ isSaved ? 'Saved' : 'Save listing' }}
              </button>
              <a v-if="callLink" :href="callLink" class="is-primary">
                <IonIcon :icon="callOutline" aria-hidden="true" /> Call contact
              </a>
              <a
                v-if="whatsappLink"
                :href="whatsappLink"
                target="_blank"
                rel="noopener noreferrer"
                class="is-whatsapp"
              >
                <IonIcon :icon="logoWhatsapp" aria-hidden="true" /> WhatsApp
              </a>
              <p v-if="actionMessage" class="listing-contact__message" role="status">
                {{ actionMessage }}
              </p>
              <small>Contact details were supplied specifically for this listing.</small>
            </aside>
          </div>
        </template>
      </main>
    </div>
    <AppBottomNav />
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  alertCircleOutline,
  arrowBackOutline,
  callOutline,
  carOutline,
  chevronForwardOutline,
  createOutline,
  heart,
  heartOutline,
  imagesOutline,
  locationOutline,
  logoWhatsapp,
  playCircleOutline,
  storefrontOutline,
} from 'ionicons/icons'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import AppBottomNav from '../components/navigation/AppBottomNav.vue'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import { useAuth } from '../composables/useAuth'
import { useListings } from '../composables/useListings'
import { useSavedProperties } from '../composables/useSavedProperties'
import { listingToMarketplaceItem } from '../services/marketplaceDiscovery'
import type { ListingRecord } from '../types/listing'
import { hasCoordinates } from '../utils/coordinates'

const PropertyMapPreview = defineAsyncComponent(
  () => import('../components/map/PropertyMapPreview.vue')
)

const route = useRoute()
const { state, canManageProperties } = useAuth()
const { findById } = useListings()
const { savedRecords, refresh: refreshSaved, toggleSavedItem } = useSavedProperties()
const listing = ref<ListingRecord | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const actionMessage = ref('')
const activeImageIndex = ref(0)

const item = computed(() => (listing.value ? listingToMarketplaceItem(listing.value) : null))
const activeImage = computed(() => listing.value?.media.images[activeImageIndex.value] ?? '')
const hasListingCoordinates = computed(() =>
  hasCoordinates(listing.value?.location.latitude, listing.value?.location.longitude)
)
const canEdit = computed(
  () =>
    Boolean(listing.value && state.profile) &&
    (listing.value?.ownerId === state.profile?.uid || state.profile?.role === 'admin')
)
const isSaved = computed(() =>
  Boolean(
    item.value &&
    savedRecords.value.some(
      (record) => record.propertyId === item.value?.id && record.source === 'listing'
    )
  )
)
const callLink = computed(() => {
  const phone = listing.value?.contact.phone.replace(/[^\d+]/g, '') ?? ''
  return phone ? `tel:${phone}` : ''
})
const whatsappLink = computed(() => {
  if (!listing.value?.contact.whatsappEnabled) return ''
  const phone = listing.value.contact.phone.replace(/\D/g, '')
  return phone ? `https://wa.me/${phone}` : ''
})
const attributeRows = computed(() =>
  Object.entries(listing.value?.attributes ?? {}).map(([key, value]) => ({
    label: key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    value: Array.isArray(value)
      ? value.join(', ')
      : typeof value === 'boolean'
        ? value
          ? 'Yes'
          : 'No'
        : String(value),
  }))
)

watch(
  () => [route.params.listingId, state.profile?.uid] as const,
  async ([listingId, userId]) => {
    void refreshSaved(userId).catch(() => undefined)
    if (!listingId) return
    await loadListing()
  },
  { immediate: true }
)

async function loadListing() {
  const listingId = String(route.params.listingId ?? '')
  isLoading.value = true
  errorMessage.value = ''
  activeImageIndex.value = 0
  try {
    listing.value = await findById(listingId)
  } catch {
    listing.value = null
    errorMessage.value = 'This listing could not be loaded. Check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleSave() {
  if (!item.value) return
  isSaving.value = true
  actionMessage.value = ''
  try {
    await toggleSavedItem(state.profile?.uid ?? state.user?.uid, item.value)
    actionMessage.value = isSaved.value ? 'Listing saved.' : 'Listing removed from saved items.'
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : 'Could not update this listing.'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.listing-details-page {
  min-height: 100%;
  background: #f5f6f8;
  color: #102033;
  padding: 12px;
}

.listing-details-page > main {
  min-width: 0;
}

.listing-details-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  min-height: 58px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  padding: 0 20px;
}

.listing-details-header > a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 800;
}

.listing-details-header > a:last-child {
  justify-self: end;
}

.listing-details-header > div {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.76rem;
}

.listing-details-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(270px, 340px);
  gap: 18px;
  padding: 18px 0 36px;
}

.listing-details-main {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.listing-gallery,
.listing-summary,
.listing-section,
.listing-contact,
.listing-details-state {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}

.listing-gallery {
  position: relative;
  overflow: hidden;
}

.listing-gallery > img,
.listing-gallery__empty {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 8;
  object-fit: cover;
}

.listing-gallery__empty {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 2.5rem;
}

.listing-gallery__empty span {
  font-size: 0.8rem;
  font-weight: 700;
}

.listing-gallery__thumbs {
  position: absolute;
  right: 14px;
  bottom: 14px;
  left: 14px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.listing-gallery__thumbs button {
  width: 64px;
  height: 48px;
  flex: 0 0 auto;
  overflow: hidden;
  border: 2px solid white;
  border-radius: 6px;
  padding: 0;
  opacity: 0.72;
}

.listing-gallery__thumbs button.active {
  border-color: #2563eb;
  opacity: 1;
}

.listing-gallery__thumbs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.listing-summary,
.listing-section {
  padding: 22px;
}

.listing-summary__badges,
.listing-delivery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.listing-summary__badges span,
.listing-delivery span {
  border-radius: 999px;
  background: #eff6ff;
  padding: 6px 10px;
  color: #1d4ed8;
  font-size: 0.7rem;
  font-weight: 800;
}

.listing-summary__badges .is-active {
  background: #ecfdf5;
  color: #047857;
}

.listing-summary h1 {
  margin: 14px 0 6px;
  font-size: clamp(1.55rem, 3vw, 2.3rem);
  line-height: 1.1;
}

.listing-summary__location,
.listing-delivery span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.listing-summary__location,
.listing-section > p {
  color: #64748b;
  line-height: 1.65;
}

.listing-summary__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 18px;
}

.listing-summary__price strong {
  color: #059669;
  font-size: 1.5rem;
}

.listing-summary__price span {
  color: #64748b;
  font-size: 0.8rem;
}

.listing-location-map {
  display: grid;
  gap: 10px;
}

.listing-location-map > header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
}

.listing-location-map h2,
.listing-location-map p {
  margin: 0;
}

.listing-location-map h2 {
  font-size: 1.05rem;
}

.listing-location-map p {
  color: #64748b;
  font-size: 0.76rem;
}

.listing-section h2,
.listing-contact h2 {
  margin: 0 0 12px;
  font-size: 1.05rem;
}

.listing-section > a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #1d4ed8;
  font-weight: 800;
}

.listing-attributes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #e2e8f0;
}

.listing-attributes div {
  min-width: 0;
  background: white;
  padding: 13px;
}

.listing-attributes dt {
  color: #64748b;
  font-size: 0.7rem;
}

.listing-attributes dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  font-size: 0.82rem;
  font-weight: 800;
}

.listing-contact {
  position: sticky;
  top: 16px;
  align-self: start;
  display: grid;
  gap: 10px;
  padding: 20px;
}

.listing-contact > p:first-child {
  margin: 0;
  color: #2563eb;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.listing-contact > span,
.listing-contact > small {
  color: #64748b;
  font-size: 0.76rem;
  line-height: 1.5;
}

.listing-contact button,
.listing-contact > a,
.listing-details-state button,
.listing-details-state a {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  color: #102033;
  font-size: 0.8rem;
  font-weight: 800;
}

.listing-contact .is-primary {
  border-color: #102033;
  background: #102033;
  color: white;
}

.listing-contact .is-whatsapp {
  border-color: #86efac;
  background: #f0fdf4;
  color: #15803d;
}

.listing-contact__message {
  border-radius: 8px;
  background: #eff6ff;
  padding: 10px;
  color: #1d4ed8 !important;
  font-size: 0.75rem !important;
  text-transform: none !important;
}

.listing-details-state {
  display: grid;
  min-height: 420px;
  place-items: center;
  align-content: center;
  gap: 12px;
  margin: 18px;
  padding: 30px;
  text-align: center;
}

.listing-details-state > ion-icon {
  color: #e11d48;
  font-size: 2.4rem;
}

@media (min-width: 1024px) {
  .listing-details-page {
    display: grid;
    grid-template-columns: 238px minmax(0, 1fr);
    gap: 12px;
  }
}

@media (max-width: 800px) {
  .listing-details-page {
    padding: 0;
  }

  .listing-details-header {
    grid-template-columns: 1fr auto;
  }

  .listing-details-header > div {
    display: none;
  }

  .listing-details-content {
    grid-template-columns: minmax(0, 1fr);
    padding: 12px;
  }

  .listing-contact {
    position: static;
    grid-row: auto;
  }

  .listing-gallery > img,
  .listing-gallery__empty {
    aspect-ratio: 4 / 3;
  }
}

@media (max-width: 520px) {
  .listing-details-header {
    padding: 0 12px;
  }

  .listing-summary,
  .listing-section,
  .listing-contact {
    padding: 16px;
  }

  .listing-attributes {
    grid-template-columns: minmax(0, 1fr);
  }
}

:global(.dark) .listing-details-page {
  background: #020617;
  color: white;
}

:global(.dark) .listing-details-header,
:global(.dark) .listing-gallery,
:global(.dark) .listing-summary,
:global(.dark) .listing-section,
:global(.dark) .listing-contact,
:global(.dark) .listing-details-state,
:global(.dark) .listing-attributes div {
  border-color: #334155;
  background: #0f172a;
}

:global(.dark) .listing-attributes {
  border-color: #334155;
  background: #334155;
}
</style>
