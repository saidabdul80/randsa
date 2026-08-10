<template>
  <AppShell
    :show-header="false"
    :show-bottom-nav="false"
    content-class="min-h-full w-full text-ink dark:bg-slate-950 dark:text-white"
  >
    <header class="fixed inset-x-0 top-0 z-40 transition duration-300" :class="headerSurfaceClass">
      <div
        class="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-12"
      >
        <RouterLink
          to="/home"
          class="text-2xl font-extrabold tracking-normal transition"
          :class="headerForegroundClass"
          @click="handleNavigationClick('/home', $event)"
        >
          RANDSA
        </RouterLink>
        <nav
          class="hidden min-w-0 items-center text-sm font-semibold md:flex"
          :class="
            isHeaderSearchOpen
              ? 'relative flex-1 justify-center'
              : 'absolute left-1/2 -translate-x-1/2 justify-center'
          "
          aria-label="Home navigation"
          @keydown.esc="closeHeaderSearch"
        >
          <div v-if="!isHeaderSearchOpen" class="flex items-center gap-5 lg:gap-7">
            <RouterLink
              v-for="link in desktopLinks"
              :key="link.to"
              :to="link.to"
              class="relative inline-flex items-center gap-1.5 py-2 transition duration-200 after:absolute after:inset-x-0 after:bottom-0 after:mx-auto after:h-0.5 after:w-0 after:rounded-full after:bg-current after:transition-all after:duration-200 hover:-translate-y-0.5 hover:after:w-full"
              :class="navigationLinkClass"
              @click="handleNavigationClick(link.to, $event)"
            >
              <IonIcon v-if="link.icon" :icon="link.icon" class="text-lg" aria-hidden="true" />
              {{ link.label }}
            </RouterLink>
            <button
              v-if="showHeaderSearch"
              type="button"
              class="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              :class="headerSearchButtonClass"
              title="Search marketplace listings"
              aria-label="Search marketplace listings"
              @click="openHeaderSearch"
            >
              <IonIcon :icon="searchOutline" class="text-lg" aria-hidden="true" />
            </button>
          </div>

          <div v-else class="relative flex min-w-0 flex-1 items-center justify-center px-12">
            <div class="flex w-full max-w-[878px] min-w-0 items-center">
              <div class="relative mr-[22px] shrink-0">
                <button
                  type="button"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  :class="headerSearchButtonClass"
                  title="Open navigation"
                  aria-label="Open navigation"
                  :aria-expanded="isHeaderMenuOpen"
                  @click="toggleHeaderMenu"
                >
                  <IonIcon :icon="menuOutline" class="text-xl" aria-hidden="true" />
                </button>
                <div
                  v-if="isHeaderMenuOpen"
                  class="absolute left-0 top-12 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-2 text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  @mouseenter="cancelHeaderMenuClose"
                  @mouseleave="scheduleHeaderMenuClose"
                  @focusin="cancelHeaderMenuClose"
                  @focusout="scheduleHeaderMenuClose"
                >
                  <RouterLink
                    v-for="link in desktopLinks"
                    :key="`menu-${link.to}`"
                    :to="link.to"
                    class="flex items-center gap-2 px-4 py-2.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    @click="handleNavigationClick(link.to, $event)"
                  >
                    <IonIcon
                      v-if="link.icon"
                      :icon="link.icon"
                      class="text-lg text-brand-600"
                      aria-hidden="true"
                    />
                    {{ link.label }}
                  </RouterLink>
                </div>
              </div>

              <form
                class="flex h-10 w-full max-w-3xl min-w-0 items-center overflow-hidden rounded-full bg-white p-1 text-slate-800 shadow-sm ring-1 ring-slate-200"
                role="search"
                @submit.prevent="submitHeaderSearch"
              >
                <label class="flex h-full min-w-0 flex-[1.1] items-center px-2 lg:px-3">
                  <IonIcon
                    :icon="locationOutline"
                    class="mr-2 shrink-0 text-base text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    ref="headerSearchInputRef"
                    v-model="search.city"
                    type="search"
                    class="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none placeholder:text-slate-400 lg:text-sm"
                    placeholder="City or street"
                    aria-label="City or street"
                  />
                </label>

                <label
                  class="flex h-7 min-w-0 flex-1 items-center border-l border-slate-200 px-2 lg:px-3"
                >
                  <IonIcon
                    :icon="homeOutline"
                    class="mr-2 shrink-0 text-base text-slate-400"
                    aria-hidden="true"
                  />
                  <select
                    v-model="search.categoryId"
                    class="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none lg:text-sm"
                    aria-label="Marketplace category"
                  >
                    <option value="">Category</option>
                    <option
                      v-for="category in marketplaceCategories"
                      :key="`header-${category.id}`"
                      :value="category.id"
                    >
                      {{ category.label }}
                    </option>
                  </select>
                </label>

                <label
                  class="flex h-7 min-w-0 flex-1 items-center border-l border-slate-200 px-2 lg:px-3"
                >
                  <IonIcon
                    :icon="cashOutline"
                    class="mr-2 shrink-0 text-base text-slate-400"
                    aria-hidden="true"
                  />
                  <select
                    v-model="search.price"
                    class="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none lg:text-sm"
                    aria-label="Price"
                  >
                    <option value="">Price</option>
                    <option value="budget">Budget: NGN 5,000 - NGN 250,000</option>
                    <option value="mid">Mid range: NGN 250,000 - NGN 1M</option>
                    <option value="premium">Premium: NGN 1M and above</option>
                  </select>
                </label>

                <button
                  type="submit"
                  class="flex h-8 shrink-0 items-center justify-center rounded-full bg-ink px-3 text-xs font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:px-4"
                >
                  Explore
                </button>
              </form>

              <button
                type="button"
                class="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                :class="headerSearchButtonClass"
                title="Close Explore"
                aria-label="Close Explore"
                @click="closeHeaderSearch"
              >
                <IonIcon :icon="closeOutline" class="text-xl" aria-hidden="true" />
              </button>
            </div>
          </div>
        </nav>
        <div class="flex items-center gap-2">
          <RouterLink
            to="/post-listing"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
            :class="
              isHeaderSolid || heroUsesDarkNavigation
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
                : 'bg-white text-brand-700'
            "
            title="Post Listing"
            aria-label="Post Listing"
          >
            <IonIcon :icon="addCircleOutline" class="text-2xl" aria-hidden="true" />
          </RouterLink>
          <RouterLink
            :to="isAuthenticated ? '/home#listings' : '/register'"
            class="inline-flex h-9 items-center justify-center rounded-full bg-red-600 px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:px-4"
            @click="isAuthenticated && handleNavigationClick('/home#listings', $event)"
          >
            Try Now
          </RouterLink>
        </div>
      </div>
    </header>

    <section
      ref="heroRef"
      class="relative min-h-[640px] overflow-hidden bg-ink text-white sm:min-h-[700px]"
      aria-roledescription="carousel"
      aria-label="RANDSA rental categories"
    >
      <img
        v-for="(slide, index) in heroSlides"
        :key="slide.title"
        :src="slide.image"
        :alt="slide.alt"
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        :class="activeSlideIndex === index ? 'opacity-100' : 'opacity-0'"
      />
      <div
        class="absolute inset-x-0 bottom-0 bg-gradient-to-r transition-colors duration-500"
        :class="
          heroUsesDarkNavigation
            ? 'top-20 from-slate-950/68 via-slate-950/24 to-transparent'
            : 'top-0 from-slate-950/82 via-slate-950/38 to-slate-950/16'
        "
      />
      <div
        class="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/54 to-transparent"
      />

      <div
        class="relative mx-auto flex min-h-[640px] w-full min-w-0 max-w-7xl flex-col px-5 pb-7 pt-24 sm:min-h-[700px] sm:px-8 lg:px-12"
      >
        <div class="flex min-w-0 flex-1 flex-col justify-center pb-10 pt-8 sm:pt-14">
          <div class="min-w-0 max-w-3xl">
            <p
              class="mb-4 inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ring-1 backdrop-blur-md"
              :class="
                heroUsesDarkNavigation
                  ? 'bg-slate-950/48 text-slate-950 ring-white/30'
                  : 'bg-white/12 text-white ring-white/18'
              "
            >
              {{ activeSlide.eyebrow }}
            </p>
            <h1
              class="max-w-3xl font-display text-5xl font-bold leading-[1.06] tracking-normal text-white sm:text-6xl lg:text-7xl"
            >
              {{ activeSlide.title }}
            </h1>
            <p class="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/86 sm:text-xl">
              {{ activeSlide.description }}
            </p>
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-2" aria-label="Hero slide controls">
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/14 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous slide"
              @click="showPreviousSlide"
            >
              <IonIcon :icon="chevronBackOutline" aria-hidden="true" />
            </button>
            <button
              v-for="(slide, index) in heroSlides"
              :key="`${slide.title}-control`"
              type="button"
              class="h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              :class="
                activeSlideIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'
              "
              :aria-label="`Show slide ${index + 1}: ${slide.eyebrow}`"
              :aria-current="activeSlideIndex === index ? 'true' : undefined"
              @click="showSlide(index)"
            />
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/14 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              :aria-label="isCarouselPaused ? 'Play slideshow' : 'Pause slideshow'"
              @click="toggleCarousel"
            >
              <IonIcon :icon="isCarouselPaused ? playOutline : pauseOutline" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/14 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next slide"
              @click="showNextSlide"
            >
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </button>
          </div>

          <form
            ref="searchFormRef"
            class="mx-auto mt-5 grid w-full min-w-0 max-w-4xl grid-cols-[minmax(0,1fr)] gap-1 overflow-hidden rounded-[22px] bg-white p-2 shadow-xl shadow-slate-950/20 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto] sm:items-center sm:rounded-full"
            @submit.prevent="submitSearch"
          >
            <label
              class="flex min-h-11 min-w-0 items-center gap-3 rounded-2xl px-4 text-slate-700 sm:rounded-full"
            >
              <ion-icon :icon="locationOutline" class="text-xl text-slate-400" />
              <input
                v-model="search.city"
                type="text"
                class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500 sm:text-base"
                placeholder="City or street"
              />
            </label>
            <label
              class="flex min-h-11 min-w-0 items-center gap-3 border-slate-200 px-4 text-slate-700 sm:border-l"
            >
              <ion-icon :icon="homeOutline" class="text-xl text-slate-400" />
              <select
                v-model="search.categoryId"
                class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none sm:text-base"
              >
                <option value="">Category</option>
                <option
                  v-for="category in marketplaceCategories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.label }}
                </option>
              </select>
            </label>
            <label
              class="flex min-h-11 min-w-0 items-center gap-3 border-slate-200 px-4 text-slate-700 sm:border-l"
            >
              <ion-icon :icon="cashOutline" class="text-xl text-slate-400" />
              <select
                v-model="search.price"
                class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none sm:text-base"
              >
                <option value="">Price</option>
                <option value="budget">Budget: NGN 5,000 - NGN 250,000</option>
                <option value="mid">Mid range: NGN 250,000 - NGN 1M</option>
                <option value="premium">Premium: NGN 1M and above</option>
              </select>
            </label>
            <button
              type="submit"
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-bold text-white transition hover:bg-slate-800 sm:min-w-24"
            >
              Explore
            </button>
          </form>
        </div>
      </div>
    </section>

    <section
      id="listings"
      ref="listingsRef"
      class="mx-auto w-full max-w-[1720px] scroll-mt-20 px-4 pb-12 pt-6 sm:px-8 lg:px-12 lg:pb-16 lg:pt-8"
    >
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
            RANDSA listings
          </p>
          <h2
            class="mt-2 text-3xl font-extrabold tracking-normal text-ink dark:text-white sm:text-4xl"
          >
            Marketplace Listings
          </h2>
        </div>
        <p class="hidden text-sm font-bold text-brand-700 sm:block">
          {{ homepageListings.length }} listings
        </p>
      </div>

      <MarketplaceDiscoveryFilters v-model="advancedFilters" @reset="clearListingSearch" />

      <p
        v-if="listingActionMessage"
        role="status"
        class="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
      >
        {{ listingActionMessage }}
      </p>

      <AdaptiveMarketplaceGrid
        v-if="displayedHomepageListings.length"
        class="mt-6"
        :listings="displayedHomepageListings"
        :saved-property-ids="savedPropertyIds"
        :compared-property-ids="comparedPropertyIds"
        :is-saving="isSavedActionLoading"
        :show-listing-actions="true"
        @toggle-saved="handleToggleSavedProperty"
        @quick-view="openQuickView"
        @toggle-compare="handleToggleCompare"
      />
      <div v-else class="mt-8 border-y border-slate-200 py-12 text-center dark:border-slate-800">
        <h3 class="text-lg font-bold text-ink dark:text-white">No matching listings</h3>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-300">
          Clear the current filters to see all marketplace listings.
        </p>
        <button
          type="button"
          class="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          @click="clearListingSearch"
        >
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
import { useRouter, RouterLink } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import {
  addCircleOutline,
  cashOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  homeOutline,
  locationOutline,
  menuOutline,
  pauseOutline,
  playOutline,
  searchOutline,
} from 'ionicons/icons'

import AppShell from '../components/layout/AppShell.vue'
import AdaptiveMarketplaceGrid from '../components/property/AdaptiveMarketplaceGrid.vue'
import ListingQuickView from '../components/property/ListingQuickView.vue'
import MarketplaceDiscoveryFilters from '../components/property/MarketplaceDiscoveryFilters.vue'
import RecentlyViewedProperties from '../components/property/RecentlyViewedProperties.vue'
import PropertyComparisonTray from '../components/property/details/PropertyComparisonTray.vue'
import heroCarImage from '../assets/randsa-hero-car.png'
import heroEventImage from '../assets/randsa-hero-event.png'
import homeHeroImage from '../assets/randsa-hero-home.png'
import heroHorsesImage from '../assets/randsa-hero-horses.png'
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
const { isAuthenticated, state } = useAuth()
const { properties, refresh: refreshProperties } = useProperties()
const { publicListings, refreshPublic: refreshPublicListings } = useListings()
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
const searchFormRef = ref<HTMLFormElement | null>(null)
const listingsRef = ref<HTMLElement | null>(null)
const headerSearchInputRef = ref<HTMLInputElement | null>(null)
const activeSlideIndex = ref(0)
const isCarouselPaused = ref(false)
const isHeaderSolid = ref(false)
const isScrollingWithinHero = ref(false)
const showHeaderSearch = ref(false)
const isHeaderSearchOpen = ref(false)
const isHeaderSearchRequested = ref(false)
const isHeaderMenuOpen = ref(false)
const listingActionMessage = ref('')
const quickViewItem = ref<MarketplaceDiscoveryItem | null>(null)
const savingPropertyId = ref('')

const heroSlides = [
  {
    eyebrow: 'Home rentals',
    title: 'Finding Your New Home Is Simple',
    description:
      'High-quality rental listings with search, inspection booking, payments, and reminders in one polished flow.',
    image: homeHeroImage,
    alt: 'Modern rental home glowing at dusk',
    navigationText: 'light',
  },
  {
    eyebrow: 'Car rentals',
    title: 'Your Next Ride Is Ready',
    description: 'Rent a standout car for everyday movement, weekend plans, and special arrivals.',
    image: heroCarImage,
    alt: 'Luxury blue car on a modern driveway at dusk',
    navigationText: 'light',
  },
  {
    eyebrow: 'Event rentals',
    title: 'A Setting Worth Celebrating',
    description:
      'Rent an elegant event setting for celebrations, receptions, and memorable gatherings.',
    image: heroEventImage,
    alt: 'Elegant outdoor event marquee prepared for a celebration',
    navigationText: 'light',
  },
  {
    eyebrow: 'Equestrian rentals',
    title: 'Ride Into Something Memorable',
    description:
      'Rent a calm countryside horse experience for a day that feels refreshingly different.',
    image: heroHorsesImage,
    alt: 'Two beautiful horses standing together on a green field',
    navigationText: 'dark',
  },
] as const

const activeSlide = computed(() => heroSlides[activeSlideIndex.value])
const heroUsesDarkNavigation = computed(() => activeSlide.value.navigationText === 'dark')

const headerSurfaceClass = computed(() => {
  if (isHeaderSolid.value) {
    return 'border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950'
  }

  if (isScrollingWithinHero.value) {
    return heroUsesDarkNavigation.value
      ? 'border-b border-black/10 bg-white/50 shadow-sm backdrop-blur-xl'
      : 'border-b border-white/10 bg-slate-950/30 shadow-sm backdrop-blur-xl'
  }

  return 'bg-transparent'
})

const headerForegroundClass = computed(() => {
  if (isHeaderSolid.value) return 'text-ink dark:text-white'
  if (heroUsesDarkNavigation.value) return 'text-slate-950'
  return 'text-white'
})

const navigationLinkClass = computed(() => {
  if (isHeaderSolid.value) {
    return 'text-slate-700 hover:text-brand-700 dark:text-slate-200 dark:hover:text-brand-300'
  }
  if (heroUsesDarkNavigation.value) return 'text-slate-950/90 hover:text-black'
  return 'text-white/95 hover:text-white'
})

const headerSearchButtonClass = computed(() => {
  if (isHeaderSolid.value)
    return 'bg-slate-100 text-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-white'
  if (heroUsesDarkNavigation.value)
    return 'bg-white/55 text-slate-950 ring-1 ring-black/10 hover:bg-white/75'
  return 'bg-white/15 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/25'
})

const desktopLinks = [
  { label: 'Home', to: '/home', icon: null },
  { label: 'Listings', to: '/home#listings', icon: null },
  { label: 'Post Listing', to: '/post-listing', icon: addCircleOutline },
  { label: 'Bookings', to: '/my-bookings', icon: null },
  { label: 'Alerts', to: '/notifications', icon: null },
  { label: 'Account Center', to: '/profile', icon: null },
]

const search = reactive<{
  city: string
  categoryId: MarketplaceCategoryId | ''
  price: string
}>({
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
const designedFeaturedListings = designedMarketplaceItems.slice(0, 3)
const additionalDesignedListings = designedMarketplaceItems.slice(3)

const savedPropertyIds = computed(
  () => new Set(savedRecords.value.map((record) => record.propertyId))
)
const comparedPropertyIds = computed(() => new Set(selectedPropertyIds.value))
const marketplacePropertyRecords = computed(() => {
  const records = [
    ...designedMarketplaceItems,
    ...properties.value.map((property) => propertyToMarketplaceItem(property)),
  ]
    .map((item) => item.propertyRecord)
    .filter((property): property is PropertyRecord => Boolean(property))
  return [...new Map(records.map((property) => [property.id, property])).values()]
})
const marketplaceDiscoveryItems = computed(() => {
  const records = [
    ...designedMarketplaceItems,
    ...properties.value
      .filter((property) => property.status === 'approved')
      .map((property) => propertyToMarketplaceItem(property)),
    ...publicListings.value.map(listingToMarketplaceItem),
  ]
  return [...new Map(records.map((item) => [item.id, item])).values()]
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
    .map((itemId) => marketplaceDiscoveryItems.value.find((item) => item.id === itemId))
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

const homepageListings = computed(() => {
  const liveListings = publicListings.value.map(listingToMarketplaceItem)
  const liveProperties = properties.value
    .filter((property) => property.status === 'approved')
    .map((property) => propertyToMarketplaceItem(property))
  const baseListings = [
    ...designedFeaturedListings,
    ...liveListings,
    ...liveProperties,
    ...additionalDesignedListings,
  ]
  const designedSources = [...designedFeaturedListings, ...additionalDesignedListings]
  const duplicateCount = Math.max(0, 20 - baseListings.length)
  const duplicatedListings = Array.from({ length: duplicateCount }, (_, index) => {
    const source = designedSources[index % designedSources.length]

    return {
      ...source,
      key: `duplicate-${index + 1}-${source.key}`,
    }
  })

  return [...baseListings, ...duplicatedListings]
})

const displayedHomepageListings = computed(() =>
  filterMarketplaceItems(homepageListings.value, advancedFilters.value)
)

let carouselTimer: number | null = null
let headerMenuCloseTimer: number | null = null
let homeScrollElement: HTMLElement | null = null
let wasHeroSearchVisible = false

onMounted(async () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  isCarouselPaused.value = prefersReducedMotion

  if (!prefersReducedMotion) {
    startCarousel()
  }

  await nextTick()
  const ionContent = heroRef.value?.closest('ion-content') as
    (HTMLElement & { getScrollElement?: () => Promise<HTMLElement> }) | null

  homeScrollElement = ionContent?.getScrollElement ? await ionContent.getScrollElement() : null
  homeScrollElement?.addEventListener('scroll', updateHeaderState, { passive: true })
  updateHeaderState()

  if (router.currentRoute.value.hash === '#listings') {
    window.requestAnimationFrame(() => scrollToListings('auto'))
  }

  try {
    await ensureAuthReady()
    await Promise.all([refreshProperties(), refreshPublicListings()])
  } catch {
    // Keep the three designed cards available if live listings cannot be refreshed.
  }
})

onBeforeUnmount(() => {
  stopCarousel()
  cancelHeaderMenuClose()
  homeScrollElement?.removeEventListener('scroll', updateHeaderState)
})

function updateHeaderState() {
  const heroHeight = heroRef.value?.offsetHeight ?? 640
  const scrollTop = homeScrollElement?.scrollTop ?? 0
  isHeaderSolid.value = scrollTop >= heroHeight - 64
  isScrollingWithinHero.value = scrollTop > 10 && !isHeaderSolid.value

  const searchRect = searchFormRef.value?.getBoundingClientRect()
  const viewportHeight = homeScrollElement?.clientHeight ?? window.innerHeight
  const heroSearchIsVisible = Boolean(
    searchRect && searchRect.bottom > 64 && searchRect.top < viewportHeight
  )
  const heroSearchJustLeft = wasHeroSearchVisible && !heroSearchIsVisible
  const hasSearchValues = Boolean(search.city.trim() || search.categoryId || search.price)

  showHeaderSearch.value = Boolean(searchRect && searchRect.bottom <= 64)

  if (heroSearchIsVisible) {
    if (!hasSearchValues) {
      isHeaderSearchRequested.value = false
    }
    suspendHeaderSearch()
  } else if (showHeaderSearch.value) {
    if (heroSearchJustLeft && hasSearchValues) {
      isHeaderSearchRequested.value = true
    }

    if (isHeaderSearchRequested.value) {
      isHeaderSearchOpen.value = true
    }
  }

  wasHeroSearchVisible = heroSearchIsVisible
}

async function openHeaderSearch() {
  isHeaderSearchRequested.value = true
  isHeaderSearchOpen.value = true
  isHeaderMenuOpen.value = false
  cancelHeaderMenuClose()
  await nextTick()
  headerSearchInputRef.value?.focus()
}

function closeHeaderSearch() {
  cancelHeaderMenuClose()
  isHeaderSearchRequested.value = false
  isHeaderSearchOpen.value = false
  isHeaderMenuOpen.value = false
}

function suspendHeaderSearch() {
  if (!isHeaderSearchOpen.value && !isHeaderMenuOpen.value) return

  cancelHeaderMenuClose()
  isHeaderSearchOpen.value = false
  isHeaderMenuOpen.value = false
}

function toggleHeaderMenu() {
  if (isHeaderMenuOpen.value) {
    cancelHeaderMenuClose()
    isHeaderMenuOpen.value = false
    return
  }

  isHeaderMenuOpen.value = true
  scheduleHeaderMenuClose()
}

function scheduleHeaderMenuClose() {
  cancelHeaderMenuClose()
  if (!isHeaderMenuOpen.value) return

  headerMenuCloseTimer = window.setTimeout(() => {
    isHeaderMenuOpen.value = false
    headerMenuCloseTimer = null
  }, 3000)
}

function cancelHeaderMenuClose() {
  if (headerMenuCloseTimer !== null) {
    window.clearTimeout(headerMenuCloseTimer)
    headerMenuCloseTimer = null
  }
}

async function handleNavigationClick(to: string, event: MouseEvent) {
  closeHeaderSearch()

  if (to === '/home#listings') {
    event.preventDefault()
    scrollToListings('auto')
    return
  }

  if (to !== '/home') return

  event.preventDefault()
  activeSlideIndex.value = 0

  if (router.currentRoute.value.path !== '/home') {
    await router.push('/home')
    await nextTick()
  }

  homeScrollElement?.scrollTo({ top: 0, behavior: 'smooth' })
  if (!isCarouselPaused.value) startCarousel()
}

function scrollToListings(behavior: ScrollBehavior = 'smooth') {
  if (!homeScrollElement || !listingsRef.value) return

  const targetTop = Math.max(
    homeScrollElement.scrollTop + listingsRef.value.getBoundingClientRect().top - 64,
    0
  )
  homeScrollElement.scrollTo({ top: targetTop, behavior })
}

function submitHeaderSearch() {
  closeHeaderSearch()
  submitSearch()
}

function startCarousel() {
  stopCarousel()
  carouselTimer = window.setInterval(() => {
    activeSlideIndex.value = (activeSlideIndex.value + 1) % heroSlides.length
  }, 6500)
}

function stopCarousel() {
  if (carouselTimer !== null) {
    window.clearInterval(carouselTimer)
    carouselTimer = null
  }
}

function showSlide(index: number) {
  activeSlideIndex.value = index
  if (!isCarouselPaused.value) startCarousel()
}

function showPreviousSlide() {
  showSlide((activeSlideIndex.value - 1 + heroSlides.length) % heroSlides.length)
}

function showNextSlide() {
  showSlide((activeSlideIndex.value + 1) % heroSlides.length)
}

function toggleCarousel() {
  isCarouselPaused.value = !isCarouselPaused.value
  if (isCarouselPaused.value) {
    stopCarousel()
  } else {
    startCarousel()
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
      error instanceof Error ? error.message : 'Could not update your saved properties.'
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
      ? 'You can compare up to three listings.'
      : result === 'added'
        ? `${item.title} was added to comparison.`
        : `${item.title} was removed from comparison.`
}
</script>
