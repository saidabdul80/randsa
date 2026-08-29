<template>
  <AppShell floating-header content-class="app-shell-bleed" :unread-count="0">
    <!-- ---------------- hero ---------------- -->
    <section
      ref="heroRef"
      class="hero"
      aria-roledescription="carousel"
      aria-label="RANDSA rental categories"
      @mouseenter="pauseForHover"
      @mouseleave="resumeAfterHover"
    >
      <div class="hero__stage">
        <img
          v-for="(slide, index) in heroSlides"
          v-show="loadedSlides.has(index)"
          :key="slide.title"
          :src="slide.image"
          :alt="index === activeSlideIndex ? slide.alt : ''"
          :loading="index === 0 ? 'eager' : 'lazy'"
          :fetchpriority="index === 0 ? 'high' : 'low'"
          decoding="async"
          class="hero__photo"
          :class="{ 'hero__photo--active': activeSlideIndex === index }"
        />
        <!--
          One consistent scrim on every slide. The old build swapped to dark text on
          certain photos, which produced near-black type on a near-black overlay.
        -->
        <span class="hero__veil" aria-hidden="true"></span>
      </div>

      <div class="hero__inner">
        <div class="hero__copy">
          <p class="rd-eyebrow hero__eyebrow">
            <span class="rd-rule" aria-hidden="true"></span>{{ activeSlide.eyebrow }}
          </p>

          <h1 class="rd-display hero__title">{{ activeSlide.title }}</h1>

          <p class="hero__lede">{{ activeSlide.description }}</p>
        </div>

        <!-- ---------------- search ---------------- -->
        <form class="search" role="search" @submit.prevent="submitSearch">
          <div class="search__field">
            <label class="rd-sr-only" for="search-city">City or street</label>
            <IonIcon :icon="locationOutline" aria-hidden="true" />
            <input
              id="search-city"
              v-model="search.city"
              type="search"
              placeholder="City or street"
              autocomplete="address-level2"
            />
          </div>

          <div class="search__field">
            <label class="rd-sr-only" for="search-category">Category</label>
            <IonIcon :icon="gridOutline" aria-hidden="true" />
            <select id="search-category" v-model="search.categoryId">
              <option value="">Any category</option>
              <option
                v-for="category in marketplaceCategories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.label }}
              </option>
            </select>
          </div>

          <div class="search__field">
            <label class="rd-sr-only" for="search-price">Price range</label>
            <IonIcon :icon="cashOutline" aria-hidden="true" />
            <select id="search-price" v-model="search.price">
              <option value="">Any price</option>
              <option value="budget">Under NGN 250,000</option>
              <option value="mid">NGN 250,000 – 1M</option>
              <option value="premium">NGN 1M and above</option>
            </select>
          </div>

          <button type="submit" class="search__submit">
            <IonIcon :icon="searchOutline" aria-hidden="true" />
            <span>Explore</span>
          </button>
        </form>

        <!-- ---------------- slide controls ---------------- -->
        <div class="hero__controls">
          <button
            type="button"
            class="hero__control"
            aria-label="Previous slide"
            @click="showPreviousSlide"
          >
            <IonIcon :icon="chevronBackOutline" aria-hidden="true" />
          </button>

          <div class="hero__ticks" role="tablist" aria-label="Featured categories">
            <button
              v-for="(slide, index) in heroSlides"
              :key="`${slide.title}-tick`"
              type="button"
              role="tab"
              class="hero__tick"
              :class="{ 'hero__tick--active': activeSlideIndex === index }"
              :aria-selected="activeSlideIndex === index"
              :aria-label="slide.eyebrow"
              @click="showSlide(index)"
            />
          </div>

          <button
            type="button"
            class="hero__control"
            :aria-label="isCarouselPaused ? 'Play slideshow' : 'Pause slideshow'"
            @click="toggleCarousel"
          >
            <IonIcon :icon="isCarouselPaused ? playOutline : pauseOutline" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="hero__control"
            aria-label="Next slide"
            @click="showNextSlide"
          >
            <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <!-- ---------------- listings ---------------- -->
    <section id="listings" ref="listingsRef" class="listings">
      <header class="listings__head">
        <div>
          <p class="rd-eyebrow"><span class="rd-rule" aria-hidden="true"></span>The marketplace</p>
          <h2 class="rd-display listings__title">Every category, one place.</h2>
        </div>

        <p class="listings__count rd-numeric" aria-live="polite">
          <template v-if="isInitialLoading">Loading listings…</template>
          <template v-else>
            {{ displayedHomepageListings.length }}
            {{ displayedHomepageListings.length === 1 ? 'listing' : 'listings' }}
            <template v-if="hasActiveFilters"> match your filters</template>
          </template>
        </p>
      </header>

      <MarketplaceDiscoveryFilters v-model="advancedFilters" @reset="clearListingSearch" />

      <p v-if="listingActionMessage" role="status" class="rd-alert listings__message">
        {{ listingActionMessage }}
      </p>

      <!-- Skeletons on first load: the grid no longer pops in from nothing. -->
      <div v-if="isInitialLoading" class="listings__skeletons" aria-hidden="true">
        <ListingCardSkeleton v-for="index in 8" :key="`skeleton-${index}`" />
      </div>

      <AdaptiveMarketplaceGrid
        v-else-if="displayedHomepageListings.length"
        class="listings__grid"
        :listings="displayedHomepageListings"
        :saved-property-ids="savedPropertyIds"
        :compared-property-ids="comparedPropertyIds"
        :is-saving="isSavedActionLoading"
        :show-listing-actions="true"
        @toggle-saved="handleToggleSavedProperty"
        @quick-view="openQuickView"
        @toggle-compare="handleToggleCompare"
      />

      <div v-else class="rd-empty listings__empty">
        <span class="rd-empty-mark" aria-hidden="true">R</span>
        <h3 class="rd-title">Nothing matches those filters</h3>
        <p class="rd-body">
          Widen the price range or clear the filters to see everything currently listed.
        </p>
        <button type="button" class="rd-cta rd-cta--sm" @click="clearListingSearch">
          Clear filters
        </button>
      </div>

      <RecentlyViewedProperties
        :properties="recentlyViewedProperties"
        @clear="clearRecentlyViewed"
        @quick-view="openQuickView"
      />
    </section>

    <ListingQuickView
      :is-open="Boolean(quickViewItem)"
      :item="quickViewItem"
      :is-saved="Boolean(quickViewItem && savedPropertyIds.has(quickViewItem.id))"
      :is-compared="Boolean(quickViewItem && comparedPropertyIds.has(quickViewItem.id))"
      :is-saving="isSavedActionLoading"
      @close="quickViewItem = null"
      @toggle-saved="handleToggleSavedProperty"
      @toggle-compare="handleToggleCompare"
    />

    <PropertyComparisonTray
      placement="marketplace"
      :properties="comparedProperties"
      :saved-property-ids="savedPropertyIds"
      :saving-property-id="savingPropertyId"
      @remove="removeComparison"
      @clear="clearComparison"
      @toggle-saved="handleToggleSavedComparedProperty"
    />
  </AppShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import {
  cashOutline,
  chevronBackOutline,
  chevronForwardOutline,
  gridOutline,
  locationOutline,
  pauseOutline,
  playOutline,
  searchOutline,
} from 'ionicons/icons'

import AppShell from '../components/layout/AppShell.vue'
import AdaptiveMarketplaceGrid from '../components/property/AdaptiveMarketplaceGrid.vue'
import ListingCardSkeleton from '../components/listings/ListingCardSkeleton.vue'
import ListingQuickView from '../components/property/ListingQuickView.vue'
import MarketplaceDiscoveryFilters from '../components/property/MarketplaceDiscoveryFilters.vue'
import RecentlyViewedProperties from '../components/property/RecentlyViewedProperties.vue'
import PropertyComparisonTray from '../components/property/details/PropertyComparisonTray.vue'
import heroCarImage from '../assets/randsa-hero-car.webp'
import heroEventImage from '../assets/randsa-hero-event.webp'
import homeHeroImage from '../assets/randsa-hero-home.webp'
import heroHorsesImage from '../assets/randsa-hero-horses.webp'
import { ensureAuthReady, useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { useListings } from '../composables/useListings'
import { usePropertyComparison } from '../composables/usePropertyComparison'
import { useRecentlyViewedProperties } from '../composables/useRecentlyViewedProperties'
import { useSavedProperties } from '../composables/useSavedProperties'
import { designedMarketplaceCards } from '../data/designedMarketplaceProperties'
import { marketplaceCategories } from '../config/marketplaceCategories'
import {
  filterMarketplaceItems,
  listingToMarketplaceItem,
  propertyToMarketplaceItem,
} from '../services/marketplaceDiscovery'
import {
  createDefaultMarketplaceFilters,
  type MarketplaceDiscoveryItem,
} from '../types/marketplace'
import type { MarketplaceCategoryId } from '../types/listing'
import type { PropertyRecord } from '../types/property'

const router = useRouter()
const { state } = useAuth()
const { properties, isLoading: arePropertiesLoading, refresh: refreshProperties } = useProperties()
const {
  publicListings,
  isLoading: areListingsLoading,
  refreshPublic: refreshPublicListings,
} = useListings()
const {
  isLoading: isSavedActionLoading,
  savedRecords,
  refresh: refreshSavedProperties,
  toggleSavedItem,
} = useSavedProperties()
const {
  selectedPropertyIds,
  toggle: toggleComparison,
  remove: removeComparison,
  clear: clearComparison,
  prune: pruneComparison,
} = usePropertyComparison()
const {
  recentlyViewedIds,
  remember: rememberRecentlyViewed,
  clear: clearRecentlyViewed,
} = useRecentlyViewedProperties()

const heroRef = ref<HTMLElement | null>(null)
const listingsRef = ref<HTMLElement | null>(null)
const activeSlideIndex = ref(0)
const loadedSlides = ref(new Set([0]))
const isCarouselPaused = ref(false)
const hasLoadedOnce = ref(false)
const listingActionMessage = ref('')
const quickViewItem = ref<MarketplaceDiscoveryItem | null>(null)
const savingPropertyId = ref('')

const heroSlides = [
  {
    eyebrow: 'Homes and spaces',
    title: 'Finding your next home, made simple.',
    description:
      'Search, inspect, book, and pay for a place to live — in one flow that keeps every step in view.',
    image: homeHeroImage,
    alt: 'A modern rental home glowing at dusk',
  },
  {
    eyebrow: 'Cars and rides',
    title: 'Your next ride is ready.',
    description:
      'Daily and weekly rentals with confirmed availability, transparent pricing, and instant booking.',
    image: heroCarImage,
    alt: 'A car parked on a modern driveway at dusk',
  },
  {
    eyebrow: 'Event spaces',
    title: 'A setting worth celebrating.',
    description:
      'Halls, marquees, and venues for receptions and gatherings, with dates you can hold in seconds.',
    image: heroEventImage,
    alt: 'An elegant outdoor event marquee prepared for a celebration',
  },
  {
    eyebrow: 'Equestrian and beyond',
    title: 'Something a little different.',
    description:
      'Horses, land, equipment, and the categories most marketplaces never get around to listing.',
    image: heroHorsesImage,
    alt: 'Two horses standing together in an open field',
  },
] as const

const activeSlide = computed(() => heroSlides[activeSlideIndex.value])

const search = reactive<{ city: string; categoryId: MarketplaceCategoryId | ''; price: string }>({
  city: '',
  categoryId: '',
  price: '',
})
const advancedFilters = ref(createDefaultMarketplaceFilters())

const designedMarketplaceItems = designedMarketplaceCards.map((card) =>
  propertyToMarketplaceItem(card.record, {
    key: card.key,
    image: card.image,
    price: card.price,
    canSpanWide: card.canSpanWide,
    source: 'fallback',
  })
)

const savedPropertyIds = computed(
  () => new Set(savedRecords.value.map((record) => record.propertyId))
)
const comparedPropertyIds = computed(() => new Set(selectedPropertyIds.value))

const isInitialLoading = computed(
  () => !hasLoadedOnce.value && (arePropertiesLoading.value || areListingsLoading.value)
)
const hasActiveFilters = computed(
  () => JSON.stringify(advancedFilters.value) !== JSON.stringify(createDefaultMarketplaceFilters())
)

/**
 * Real listings first, then the designed showcase cards as a backfill.
 *
 * The previous build cloned showcase cards until the grid held 20 items and reported
 * that padded number as the listing count. Duplicated listings misrepresent inventory,
 * so the grid now shows exactly what exists.
 */
const homepageListings = computed(() => {
  const liveListings = publicListings.value.map(listingToMarketplaceItem)
  const liveProperties = properties.value
    .filter((property) => property.status === 'approved')
    .map((property) => propertyToMarketplaceItem(property))

  const combined = [...liveListings, ...liveProperties, ...designedMarketplaceItems]

  return [...new Map(combined.map((item) => [item.id, item])).values()]
})

const displayedHomepageListings = computed(() =>
  filterMarketplaceItems(homepageListings.value, advancedFilters.value)
)

const marketplacePropertyRecords = computed(() => {
  const records = homepageListings.value
    .map((item) => item.propertyRecord)
    .filter((property): property is PropertyRecord => Boolean(property))
  return [...new Map(records.map((property) => [property.id, property])).values()]
})

const comparedProperties = computed(() =>
  selectedPropertyIds.value
    .map((propertyId) =>
      marketplacePropertyRecords.value.find((property) => property.id === propertyId)
    )
    .filter((property): property is PropertyRecord => Boolean(property))
)

const recentlyViewedProperties = computed(() =>
  recentlyViewedIds.value
    .map((itemId) => homepageListings.value.find((item) => item.id === itemId))
    .filter((item): item is MarketplaceDiscoveryItem => Boolean(item))
    .slice(0, 5)
)

watch(
  () => state.profile?.uid ?? state.user?.uid,
  (userId) => {
    void refreshSavedProperties(userId).catch(() => undefined)
  },
  { immediate: true }
)

watch(
  () => marketplacePropertyRecords.value.map((property) => property.id).join('|'),
  () => pruneComparison(marketplacePropertyRecords.value.map((property) => property.id))
)

let carouselTimer: number | null = null
let homeScrollElement: HTMLElement | null = null

onMounted(async () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  isCarouselPaused.value = prefersReducedMotion
  if (!prefersReducedMotion) startCarousel()

  await nextTick()
  const ionContent = heroRef.value?.closest('ion-content') as
    (HTMLElement & { getScrollElement?: () => Promise<HTMLElement> }) | null
  homeScrollElement = ionContent?.getScrollElement ? await ionContent.getScrollElement() : null

  applyCategoryFromQuery()

  if (router.currentRoute.value.hash === '#listings') {
    window.requestAnimationFrame(() => scrollToListings('auto'))
  }

  try {
    await ensureAuthReady()
    await Promise.all([refreshProperties(), refreshPublicListings()])
  } catch {
    // The designed showcase cards keep the marketplace populated if the fetch fails.
  } finally {
    hasLoadedOnce.value = true
  }
})

onBeforeUnmount(stopCarousel)

/* ---------------- carousel ---------------- */

function startCarousel() {
  stopCarousel()
  carouselTimer = window.setInterval(() => {
    showSlide((activeSlideIndex.value + 1) % heroSlides.length, { restart: false })
  }, 7000)
}

function stopCarousel() {
  if (carouselTimer === null) return
  window.clearInterval(carouselTimer)
  carouselTimer = null
}

function showSlide(index: number, options: { restart?: boolean } = {}) {
  loadedSlides.value = new Set(loadedSlides.value).add(index)
  activeSlideIndex.value = index
  if (options.restart !== false && !isCarouselPaused.value) startCarousel()
}

function showPreviousSlide() {
  showSlide((activeSlideIndex.value - 1 + heroSlides.length) % heroSlides.length)
}

function showNextSlide() {
  showSlide((activeSlideIndex.value + 1) % heroSlides.length)
}

function toggleCarousel() {
  isCarouselPaused.value = !isCarouselPaused.value
  if (isCarouselPaused.value) stopCarousel()
  else startCarousel()
}

// Pausing on hover keeps the slide still while someone is reading it.
function pauseForHover() {
  if (!isCarouselPaused.value) stopCarousel()
}

function resumeAfterHover() {
  if (!isCarouselPaused.value) startCarousel()
}

/* ---------------- search ---------------- */

function scrollToListings(behavior: ScrollBehavior = 'smooth') {
  if (!listingsRef.value) return

  if (!homeScrollElement) {
    listingsRef.value.scrollIntoView({ behavior, block: 'start' })
    return
  }

  const targetTop = Math.max(
    homeScrollElement.scrollTop + listingsRef.value.getBoundingClientRect().top - 72,
    0
  )
  homeScrollElement.scrollTo({ top: targetTop, behavior })
}

/** Supports deep links such as /home?category=vehicles#listings from the welcome page. */
function applyCategoryFromQuery() {
  const requested = router.currentRoute.value.query.category

  if (typeof requested !== 'string' || !requested) return
  if (!marketplaceCategories.some((category) => category.id === requested)) return

  search.categoryId = requested as MarketplaceCategoryId
  advancedFilters.value = {
    ...advancedFilters.value,
    categoryId: requested as MarketplaceCategoryId,
  }
}

function submitSearch() {
  const priceRange =
    search.price === 'budget'
      ? { minPrice: 5_000, maxPrice: 250_000 }
      : search.price === 'mid'
        ? { minPrice: 250_001, maxPrice: 1_000_000 }
        : search.price === 'premium'
          ? { minPrice: 1_000_001, maxPrice: null }
          : { minPrice: null, maxPrice: null }

  advancedFilters.value = {
    ...advancedFilters.value,
    search: search.city.trim(),
    categoryId: search.categoryId || 'all',
    subcategoryId: '',
    ...priceRange,
  }
  scrollToListings()
}

function clearListingSearch() {
  search.city = ''
  search.categoryId = ''
  search.price = ''
  advancedFilters.value = createDefaultMarketplaceFilters()
}

/* ---------------- listing actions ---------------- */

async function handleToggleSavedProperty(item: MarketplaceDiscoveryItem) {
  const userId = state.profile?.uid ?? state.user?.uid
  const wasSaved = savedPropertyIds.value.has(item.id)
  listingActionMessage.value = ''
  savingPropertyId.value = item.id

  try {
    await toggleSavedItem(userId, item)
    listingActionMessage.value = wasSaved
      ? `${item.title} was removed from your saved listings.`
      : `${item.title} was added to your saved listings.`
  } catch (error) {
    listingActionMessage.value =
      error instanceof Error ? error.message : 'Could not update your saved listings.'
  } finally {
    savingPropertyId.value = ''
  }
}

function handleToggleSavedComparedProperty(property: PropertyRecord) {
  return handleToggleSavedProperty(propertyToMarketplaceItem(property))
}

function openQuickView(item: MarketplaceDiscoveryItem) {
  quickViewItem.value = item
  rememberRecentlyViewed(item.id)
}

function handleToggleCompare(item: MarketplaceDiscoveryItem) {
  if (!item.propertyRecord) return
  const result = toggleComparison(item.id)
  listingActionMessage.value =
    result === 'limit'
      ? 'You can compare up to three listings at a time.'
      : result === 'added'
        ? `${item.title} was added to comparison.`
        : `${item.title} was removed from comparison.`
}
</script>

<style scoped>
/* ---------------- hero ---------------- */

.hero {
  position: relative;
  display: flex;
  min-height: min(88vh, 780px);
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  background: var(--rd-plate);
}

.hero__stage {
  position: absolute;
  inset: 0;
}

.hero__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.04);
  transition:
    opacity 1200ms ease,
    transform 8000ms ease-out;
}

.hero__photo--active {
  opacity: 1;
  transform: scale(1);
}

/* A single scrim, dark enough for plate-ink type at every slide. */
.hero__veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to top,
      rgba(7, 10, 15, 0.92) 0%,
      rgba(7, 10, 15, 0.45) 45%,
      rgba(7, 10, 15, 0.55) 100%
    ),
    linear-gradient(to right, rgba(7, 10, 15, 0.6), transparent 62%);
}

.hero__inner {
  position: relative;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 140px clamp(16px, 4vw, 48px) clamp(28px, 4vw, 44px);
}

.hero__copy {
  max-width: 660px;
}

.hero__eyebrow {
  color: var(--rd-plate-accent);
}

.hero__title {
  margin-top: 22px;
  color: var(--rd-plate-ink);
  font-size: clamp(38px, 5.6vw, 76px);
}

.hero__lede {
  max-width: 520px;
  margin: 22px 0 0;
  color: rgba(248, 245, 240, 0.82);
  font-size: 15px;
  font-weight: 500;
  line-height: 1.75;
}

/* ---------------- search ---------------- */

.search {
  display: grid;
  max-width: 940px;
  margin-top: 38px;
  border: 1px solid rgba(248, 245, 240, 0.16);
  border-radius: var(--rd-radius);
  background: rgba(11, 14, 19, 0.55);
  backdrop-filter: blur(14px);
  gap: 1px;
  grid-template-columns: 1fr;
  overflow: hidden;
}

.search__field {
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 12px;
  background: rgba(11, 14, 19, 0.25);
  padding: 0 18px;
  color: rgba(248, 245, 240, 0.62);
}

.search__field ion-icon {
  flex: 0 0 auto;
  font-size: 18px;
}

.search__field input,
.search__field select {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--rd-plate-ink);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  outline: none;
}

.search__field input::placeholder {
  color: rgba(248, 245, 240, 0.5);
}

.search__field select option {
  background: #14181f;
  color: #f8f5f0;
}

.search__field:focus-within {
  background: rgba(11, 14, 19, 0.5);
  color: var(--rd-plate-accent);
}

.search__submit {
  display: inline-flex;
  min-height: 58px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  background: var(--rd-plate-accent);
  color: #14181f;
  font-family: inherit;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 220ms ease;
}

.search__submit:hover {
  background: #dcc08a;
}

/* ---------------- hero controls ---------------- */

.hero__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 30px;
}

.hero__control {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid rgba(248, 245, 240, 0.24);
  border-radius: 999px;
  background: transparent;
  color: var(--rd-plate-ink);
  font-size: 15px;
  cursor: pointer;
  transition:
    border-color 200ms ease,
    background-color 200ms ease;
}

.hero__control:hover {
  border-color: var(--rd-plate-accent);
  background: rgba(201, 169, 106, 0.16);
}

.hero__ticks {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-inline: 6px;
}

.hero__tick {
  width: 26px;
  height: 2px;
  border: 0;
  padding: 0;
  background: rgba(248, 245, 240, 0.32);
  cursor: pointer;
  transition:
    width 300ms cubic-bezier(0.33, 0, 0.2, 1),
    background-color 300ms ease;
}

/* Bigger invisible hit area than the 2px rule it draws. */
.hero__tick::after {
  display: block;
  height: 34px;
  margin-top: -16px;
  content: '';
}

.hero__tick--active {
  width: 48px;
  background: var(--rd-plate-accent);
}

/* ---------------- listings ---------------- */

.listings {
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(48px, 7vw, 88px) clamp(16px, 4vw, 48px) clamp(40px, 6vw, 72px);
  scroll-margin-top: 72px;
}

.listings__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: clamp(22px, 3vw, 34px);
}

.listings__title {
  margin-top: 18px;
  font-size: clamp(26px, 3.2vw, 42px);
}

.listings__count {
  margin: 0;
  color: var(--rd-subtle);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.listings__message {
  margin-top: 20px;
}

.listings__grid {
  margin-top: 26px;
}

/*
 * Mirrors AdaptiveMarketplaceGrid: same columns, gaps, row height, and a feature-sized
 * first tile, so the mosaic does not jump when real listings replace the skeletons.
 */
.listings__skeletons {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 196px;
  margin-top: 26px;
}

.listings__skeletons > :first-child {
  grid-column: span 2;
}

@media (min-width: 640px) {
  .listings__skeletons {
    gap: 18px;
    grid-auto-rows: 236px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .listings__skeletons > :first-child {
    grid-row: span 2;
  }
}

@media (min-width: 1024px) {
  .listings__skeletons {
    gap: 20px;
    grid-auto-rows: 248px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1440px) {
  .listings__skeletons {
    grid-auto-rows: 260px;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

.listings__empty {
  margin-top: 30px;
}

/* ---------------- responsive ---------------- */

@media (min-width: 760px) {
  .search {
    grid-template-columns: 1.3fr 1fr 1fr auto;
  }

  .search__submit {
    padding-inline: 34px;
  }
}

@media (max-width: 759px) {
  .hero {
    min-height: auto;
  }

  .hero__inner {
    padding-top: 120px;
  }

  .hero__lede {
    font-size: 13px;
  }

  .search {
    margin-top: 28px;
  }

  .hero__controls {
    margin-top: 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__photo,
  .hero__tick,
  .hero__control,
  .search__submit {
    transition: none;
  }

  .hero__photo {
    transform: none;
  }
}
</style>
