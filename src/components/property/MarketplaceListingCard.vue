<template>
  <article
    role="listitem"
    :data-desktop-span="layout.desktopSpan"
    :data-desktop-position="layout.desktopPosition ?? ''"
    :data-large-desktop-span="layout.largeDesktopSpan"
    :data-large-desktop-position="layout.largeDesktopPosition ?? ''"
    :data-tablet-span="layout.tabletSpan"
    :data-mobile-span="layout.mobileSpan"
    :data-low-resolution="isLowResolution ? 'true' : 'false'"
    :data-property-id="listing.id"
    class="marketplace-card group relative isolate min-w-0 overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_14px_36px_-28px_rgba(16,32,51,0.45)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_48px_-28px_rgba(16,32,51,0.58)] focus-within:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    :class="{
      'marketplace-card--desktop-wide-left': layout.desktopPosition === 'left',
      'marketplace-card--desktop-wide-right': layout.desktopPosition === 'right',
      'marketplace-card--large-desktop-wide-left': layout.largeDesktopPosition === 'left',
      'marketplace-card--large-desktop-wide-right': layout.largeDesktopPosition === 'right',
      'marketplace-card--tablet-wide': layout.tabletSpan === 2,
      'marketplace-card--mobile-wide': layout.mobileSpan === 2,
      'marketplace-card--emphasized': layout.emphasis === 'featured' && !isLowResolution,
      'marketplace-card--low-resolution': isLowResolution,
      'marketplace-card--highlighted': isHighlighted,
      'marketplace-card--row': displayMode === 'list',
    }"
    @mouseenter="emitHighlight"
    @mouseleave="$emit('highlight', '')"
    @focusin="emitHighlight"
  >
    <RouterLink
      :to="listing.detailPath"
      class="marketplace-card__card-link absolute inset-0 z-[3] rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      :aria-label="`View details for ${listing.title}`"
    >
      <span class="sr-only">View details for {{ listing.title }}</span>
    </RouterLink>

    <div
      class="marketplace-card__media bg-slate-100 dark:bg-slate-800"
      :style="{ aspectRatio: effectiveImageRatio }"
    >
      <img
        v-if="listing.image"
        :src="listing.image"
        :alt="`${listing.title} in ${listing.location}`"
        class="marketplace-card__image absolute inset-0 z-0 h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.035]"
        loading="lazy"
        decoding="async"
        @load="handleImageLoad"
      />
      <div v-else class="marketplace-card__image-empty" aria-hidden="true">
        <ion-icon :icon="emptyStateIcon" />
      </div>

      <div
        class="pointer-events-none absolute inset-x-2.5 top-2.5 z-[4] flex items-start justify-between gap-2"
      >
        <div class="flex min-w-0 flex-1 items-center gap-1.5 pr-1">
          <span
            class="marketplace-card__title-badge min-w-0 truncate rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-sm sm:text-[11px]"
            :title="listing.title"
          >
            {{ listing.title }}
          </span>
          <span
            v-if="statusBadgeLabel"
            class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md"
            :class="
              statusBadgeTone === 'booking'
                ? 'bg-red-600 text-white'
                : statusBadgeTone === 'available'
                  ? 'bg-emerald-50/95 text-emerald-700 dark:bg-emerald-950/85 dark:text-emerald-200'
                  : 'bg-white/90 text-slate-700 dark:bg-slate-950/80 dark:text-slate-100'
            "
            :title="listing.availabilityLabel"
            :aria-label="listing.availabilityLabel"
          >
            {{ statusBadgeLabel }}
          </span>
        </div>

        <button
          v-if="listing.id"
          type="button"
          class="marketplace-card__favorite pointer-events-auto inline-flex h-9 w-9 shrink-0 items-center justify-center border-0 bg-transparent p-2 text-xl shadow-none transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-wait disabled:opacity-60"
          :class="{
            'is-saved text-red-600': isSaved,
            'text-white': !isSaved,
          }"
          :aria-label="
            isSaved ? `Remove ${listing.title} from saved listings` : `Save ${listing.title}`
          "
          :aria-pressed="isSaved"
          :disabled="isSaving"
          @click.stop="$emit('toggle-saved', listing)"
        >
          <ion-icon :icon="heart" aria-hidden="true" />
        </button>
      </div>

      <div v-if="showListingActions" class="marketplace-card__quick-actions">
        <button
          type="button"
          :aria-label="`Quick view ${listing.title}`"
          title="Quick view"
          @click.stop="$emit('quick-view', listing)"
        >
          <ion-icon :icon="eyeOutline" aria-hidden="true" />
        </button>
        <button
          v-if="listing.propertyRecord"
          type="button"
          :class="{ 'is-active': isCompared }"
          :aria-label="`${isCompared ? 'Remove' : 'Add'} ${listing.title} ${
            isCompared ? 'from' : 'to'
          } comparison`"
          :aria-pressed="isCompared"
          title="Compare"
          @click.stop="$emit('toggle-compare', listing)"
        >
          <ion-icon :icon="gitCompareOutline" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="marketplace-card__body p-3.5 sm:p-4">
      <div
        class="marketplace-card__location flex min-w-0 items-center gap-1.5 text-slate-500 dark:text-slate-300"
      >
        <ion-icon :icon="locationOutline" class="shrink-0" aria-hidden="true" />
        <p class="min-w-0 truncate text-[11px] font-semibold sm:text-xs">
          {{ listing.location }}
        </p>
      </div>

      <div
        v-if="metadata.length"
        class="marketplace-card__metadata flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 sm:text-xs"
      >
        <span
          v-for="item in metadata"
          :key="item.label"
          class="inline-flex min-w-0 items-center gap-1.5"
          :title="item.label"
        >
          <ion-icon :icon="metadataIcon(item.kind)" aria-hidden="true" />
          <span class="truncate">{{ item.value }}</span>
          <span class="sr-only">{{ item.label }}</span>
        </span>
      </div>

      <div class="marketplace-card__footer flex min-w-0 items-end justify-between gap-2">
        <p
          class="marketplace-card__price min-w-0 truncate text-sm font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-base"
        >
          {{ listing.price }}
          <span
            v-if="listing.paymentDuration"
            class="marketplace-card__period text-[10px] font-medium text-slate-500 dark:text-slate-300 sm:text-[11px]"
          >
            / {{ listing.paymentDuration }}
          </span>
        </p>
      </div>

      <div class="marketplace-card__masonry-fill" aria-hidden="true"></div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { RouterLink } from 'vue-router'
import {
  bedOutline,
  briefcaseOutline,
  calendarOutline,
  carOutline,
  cubeOutline,
  eyeOutline,
  gitCompareOutline,
  heart,
  leafOutline,
  locationOutline,
  phonePortraitOutline,
  resizeOutline,
  speedometerOutline,
  storefrontOutline,
  syncOutline,
  timeOutline,
  waterOutline,
} from 'ionicons/icons'

import { isInspectionMode, resolveBookingMode } from '../../services/bookingModes'
import { getMarketplaceCategory } from '../../config/marketplaceCategories'
import type { MarketplaceDiscoveryItem, MarketplaceMetadataKind } from '../../types/marketplace'

type MarketplaceVariant = 'property' | 'car' | 'event' | 'horse' | 'office'

interface ListingLayout {
  variant: MarketplaceVariant
  desktopSpan: 1 | 2
  desktopPosition: 'left' | 'right' | null
  largeDesktopSpan: 1 | 2
  largeDesktopPosition: 'left' | 'right' | null
  tabletSpan: 1 | 2
  mobileSpan: 1 | 2
  imageRatio: '16 / 9' | '3 / 2' | '4 / 3' | '1 / 1' | '4 / 5'
  emphasis: 'standard' | 'featured'
}

const props = withDefaults(
  defineProps<{
    listing: MarketplaceDiscoveryItem
    layout: ListingLayout
    isSaved: boolean
    isCompared?: boolean
    isHighlighted?: boolean
    isSaving: boolean
    showListingActions?: boolean
    displayMode?: 'grid' | 'list' | 'split'
  }>(),
  {
    isCompared: false,
    isHighlighted: false,
    showListingActions: false,
    displayMode: 'grid',
  }
)

const emit = defineEmits<{
  'toggle-saved': [item: MarketplaceDiscoveryItem]
  'quick-view': [item: MarketplaceDiscoveryItem]
  'toggle-compare': [item: MarketplaceDiscoveryItem]
  highlight: [propertyId: string]
}>()

const isLowResolution = ref(false)

const usesDirectBooking = computed(() => {
  if (props.listing.propertyRecord) {
    return !isInspectionMode(resolveBookingMode(props.listing.propertyRecord))
  }

  return props.listing.availabilityTone === 'booking'
})

const statusBadgeTone = computed(() => {
  if (props.listing.propertyRecord) return usesDirectBooking.value ? 'booking' : 'available'
  return props.listing.availabilityTone
})

const statusBadgeLabel = computed(() => {
  if (props.listing.propertyRecord) return usesDirectBooking.value ? 'B' : 'A'
  return props.listing.availabilityLabel
})

const emptyStateIcon = computed(
  () => getMarketplaceCategory(props.listing.categoryId)?.icon ?? storefrontOutline
)

const effectiveImageRatio = computed(() =>
  isLowResolution.value &&
  (props.layout.desktopSpan === 2 ||
    props.layout.largeDesktopSpan === 2 ||
    props.layout.tabletSpan === 2 ||
    props.layout.mobileSpan === 2)
    ? '4 / 3'
    : props.layout.imageRatio
)

const metadata = computed(() => props.listing.metadata)

function metadataIcon(kind: MarketplaceMetadataKind) {
  const icons: Record<MarketplaceMetadataKind, string> = {
    area: resizeOutline,
    bathrooms: waterOutline,
    bedrooms: bedOutline,
    brand: storefrontOutline,
    condition: syncOutline,
    delivery: carOutline,
    employment: briefcaseOutline,
    mileage: speedometerOutline,
    model: cubeOutline,
    parking: carOutline,
    quantity: leafOutline,
    'service-area': locationOutline,
    storage: phonePortraitOutline,
    transmission: syncOutline,
    workplace: storefrontOutline,
    year: calendarOutline,
  }
  return icons[kind] ?? timeOutline
}

function handleImageLoad(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  isLowResolution.value = image.naturalWidth < 720 || image.naturalHeight < 480
}

function emitHighlight() {
  emit('highlight', props.listing.id)
}
</script>

<style scoped>
.marketplace-card {
  grid-column: span 1;
  align-self: start;
}

.marketplace-card--rendered-wide::after {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 35%;
  background: linear-gradient(
    to top,
    rgb(0 0 0 / 0.55) 0%,
    rgb(0 0 0 / 0.28) 45%,
    rgb(0 0 0 / 0) 100%
  );
  content: '';
  pointer-events: none;
}

.marketplace-card__image {
  pointer-events: none;
}

.marketplace-card__image-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, rgb(239 246 255), rgb(248 250 252));
  color: rgb(37 99 235);
  font-size: 3rem;
}

:global(.dark) .marketplace-card__image-empty {
  background: linear-gradient(145deg, rgb(15 23 42), rgb(30 41 59));
  color: rgb(147 197 253);
}

.marketplace-card__media {
  position: relative;
  overflow: hidden;
}

.marketplace-card__body {
  --marketplace-card-body-gap: 5px;

  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--marketplace-card-body-gap);
  background: white;
}

.marketplace-card__masonry-fill {
  display: none;
}

.marketplace-card--masonry-filled .marketplace-card__masonry-fill {
  display: block;
  flex: 0 0 var(--marketplace-card-masonry-fill, 0px);
  height: var(--marketplace-card-masonry-fill, 0px);
  margin-top: calc(var(--marketplace-card-body-gap) * -1);
  pointer-events: none;
}

.marketplace-card__location,
.marketplace-card__metadata,
.marketplace-card__price,
.marketplace-card__period {
  line-height: 1.15;
}

.marketplace-card--low-resolution {
  grid-column: span 1 !important;
}

.marketplace-card--highlighted {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.14);
}

.marketplace-card__favorite.is-saved,
.marketplace-card__favorite.is-saved:hover {
  border-color: transparent;
  background: transparent;
  color: rgb(220 38 38);
}

.marketplace-card__favorite {
  transform: translateY(-7px);
}

.marketplace-card__favorite:hover {
  transform: translateY(-7px) scale(1.1);
}

.marketplace-card__favorite ion-icon {
  filter: none;
}

.marketplace-card__quick-actions ion-icon {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.72));
}

.marketplace-card.marketplace-card--rendered-wide {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.marketplace-card.marketplace-card--rendered-wide:hover {
  border-color: transparent;
  box-shadow: none;
}

.marketplace-card--rendered-wide .marketplace-card__media {
  grid-area: 1 / 1;
  border-radius: 18px;
  box-shadow: 0 14px 36px -28px rgb(16 32 51 / 0.45);
}

.marketplace-card--rendered-wide:hover .marketplace-card__media {
  box-shadow: 0 24px 48px -28px rgb(16 32 51 / 0.58);
}

.marketplace-card--rendered-wide.marketplace-card--highlighted .marketplace-card__media,
.marketplace-card--rendered-wide:focus-within .marketplace-card__media {
  box-shadow:
    0 0 0 3px rgb(59 130 246 / 0.14),
    0 24px 48px -28px rgb(16 32 51 / 0.58);
}

.marketplace-card--rendered-wide .marketplace-card__body {
  grid-area: 1 / 1;
  align-self: end;
  position: relative;
  z-index: 2;
  isolation: isolate;
  width: 100%;
  background: transparent;
  color: white;
  text-shadow: 0 1px 3px rgb(0 0 0 / 0.62);
}

.marketplace-card--rendered-wide .marketplace-card__location,
.marketplace-card--rendered-wide .marketplace-card__metadata,
.marketplace-card--rendered-wide .marketplace-card__price,
.marketplace-card--rendered-wide .marketplace-card__period {
  color: white;
}

.marketplace-card--rendered-wide .marketplace-card__period {
  color: rgb(255 255 255 / 0.78);
}

.marketplace-card--rendered-wide:has(.marketplace-card__quick-actions) .marketplace-card__price {
  max-width: calc(100% - 108px);
}

.marketplace-card--rendered-wide .marketplace-card__quick-actions {
  z-index: 4;
  right: 14px;
  bottom: 14px;
}

.marketplace-card--rendered-wide .marketplace-card__quick-actions button {
  border-color: transparent;
  background: transparent;
  color: white;
}

.marketplace-card--rendered-wide .marketplace-card__quick-actions button:hover,
.marketplace-card--rendered-wide .marketplace-card__quick-actions button.is-active {
  background: transparent;
  color: white;
}

.marketplace-card__quick-actions {
  position: absolute;
  z-index: 4;
  right: 10px;
  bottom: 10px;
  display: flex;
  gap: 6px;
}

.marketplace-card__quick-actions button {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  background: transparent;
  color: white;
  box-shadow: none;
  transition: transform 160ms ease;
}

.marketplace-card__quick-actions button:hover,
.marketplace-card__quick-actions button.is-active {
  background: transparent;
  color: white;
  transform: scale(1.12);
}

:global(.dark) .marketplace-card:not(.marketplace-card--rendered-wide) .marketplace-card__body {
  background: rgb(15 23 42);
}

@media (min-width: 1024px) and (max-width: 1254px) {
  .marketplace-card--desktop-wide-left {
    grid-column: 1 / span 2;
  }

  .marketplace-card--desktop-wide-right {
    grid-column: 3 / span 2;
  }
}

@media (min-width: 1255px) {
  .marketplace-card--large-desktop-wide-left {
    grid-column: 1 / span 2;
  }

  .marketplace-card--large-desktop-wide-right {
    grid-column: 4 / span 2;
  }
}

@media (min-width: 768px) {
  .marketplace-card--row {
    display: grid;
    grid-template-columns: minmax(210px, 0.42fr) minmax(0, 0.58fr);
  }

  .marketplace-card--row .marketplace-card__media {
    height: 100%;
    min-height: 190px;
    aspect-ratio: auto !important;
  }

  .marketplace-card--row .marketplace-card__body {
    align-self: center;
    padding: 22px;
  }
}

@media (max-width: 575px) {
  .marketplace-card--mobile-wide {
    grid-column: span 2;
  }

  .marketplace-card:not(.marketplace-card--mobile-wide) .marketplace-card__metadata {
    display: none;
  }

  .marketplace-card:not(.marketplace-card--mobile-wide) .marketplace-card__body {
    padding: 0.75rem;
  }

  .marketplace-card__quick-actions {
    right: 8px;
    bottom: 8px;
    gap: 2px;
  }
}

@media (min-width: 576px) and (max-width: 1023px) {
  .marketplace-card--tablet-wide {
    grid-column: span 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  .marketplace-card,
  .marketplace-card img,
  .marketplace-card__favorite {
    transition: none !important;
  }

  .marketplace-card:hover {
    transform: none;
  }

  .marketplace-card:hover img {
    transform: none;
  }
}
</style>
