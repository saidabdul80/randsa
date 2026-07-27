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
    :data-property-id="listing.id ?? ''"
    class="marketplace-card group min-w-0 overflow-hidden rounded-[18px] border border-slate-200/80 bg-white shadow-[0_14px_36px_-28px_rgba(16,32,51,0.45)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_48px_-28px_rgba(16,32,51,0.58)] focus-within:border-brand-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
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
    <div
      class="marketplace-card__media relative overflow-hidden bg-slate-100 dark:bg-slate-800"
      :style="{ aspectRatio: effectiveImageRatio }"
    >
      <img
        :src="listing.image"
        :alt="`${listing.title} in ${listing.location}`"
        class="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-[1.035]"
        loading="lazy"
        decoding="async"
        @load="handleImageLoad"
      />

      <div class="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
        <div class="flex min-w-0 flex-wrap gap-1.5">
          <span
            class="max-w-full truncate rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-md dark:bg-slate-950/85 dark:text-white"
          >
            {{ listing.propertyType }}
          </span>
          <span
            v-if="listing.isAvailable"
            class="rounded-full bg-emerald-50/95 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur-md dark:bg-emerald-950/85 dark:text-emerald-200"
          >
            Available
          </span>
        </div>

        <button
          v-if="listing.record"
          type="button"
          class="marketplace-card__favorite inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/92 text-lg text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:bg-slate-950/85 dark:text-slate-100"
          :class="isSaved ? 'text-rose-600 dark:text-rose-400' : ''"
          :aria-label="
            isSaved ? `Remove ${listing.title} from saved properties` : `Save ${listing.title}`
          "
          :aria-pressed="isSaved"
          :disabled="isSaving"
          @click="$emit('toggle-saved', listing.record)"
        >
          <ion-icon :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
        </button>
      </div>

      <div v-if="showListingActions && listing.record" class="marketplace-card__quick-actions">
        <button
          type="button"
          :aria-label="`Quick view ${listing.title}`"
          title="Quick view"
          @click="$emit('quick-view', listing.record)"
        >
          <ion-icon :icon="eyeOutline" aria-hidden="true" />
        </button>
        <button
          type="button"
          :class="{ 'is-active': isCompared }"
          :aria-label="`${isCompared ? 'Remove' : 'Add'} ${listing.title} ${
            isCompared ? 'from' : 'to'
          } comparison`"
          :aria-pressed="isCompared"
          title="Compare"
          @click="$emit('toggle-compare', listing.record)"
        >
          <ion-icon :icon="gitCompareOutline" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="marketplace-card__body p-3.5 sm:p-4">
      <div class="marketplace-card__identity flex min-w-0 items-start justify-between gap-3">
        <div class="marketplace-card__identity-copy min-w-0">
          <h3
            class="marketplace-card__title truncate text-sm font-extrabold tracking-normal text-ink dark:text-white sm:text-base"
          >
            {{ listing.title }}
          </h3>
          <p
            class="marketplace-card__location truncate text-[11px] font-medium text-slate-500 dark:text-slate-300 sm:text-xs"
          >
            {{ listing.location }}
          </p>
        </div>
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
          <ion-icon :icon="item.icon" aria-hidden="true" />
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
            class="marketplace-card__period text-[10px] font-medium text-slate-500 dark:text-slate-300 sm:text-[11px]"
          >
            / {{ listing.paymentDuration }}
          </span>
        </p>
        <RouterLink
          v-if="listing.id"
          :to="`/properties/${listing.id}`"
          class="marketplace-card__details inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-base text-ink transition hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-slate-800 dark:text-white dark:hover:bg-brand-600"
          :aria-label="`View details for ${listing.title}`"
        >
          <ion-icon :icon="arrowForwardOutline" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonIcon } from '@ionic/vue'
import { RouterLink } from 'vue-router'
import {
  arrowForwardOutline,
  bedOutline,
  carOutline,
  eyeOutline,
  gitCompareOutline,
  heart,
  heartOutline,
  resizeOutline,
  waterOutline,
} from 'ionicons/icons'

import type { PropertyRecord } from '../../types/property'

type MarketplaceVariant = 'property' | 'car' | 'event' | 'horse' | 'office'

interface MarketplaceListing {
  key: string
  id: string | null
  title: string
  location: string
  beds: number
  parking: number
  baths: number
  price: string
  paymentDuration: string
  propertyType: string
  isAvailable: boolean
  image: string
  shopSize?: string
  canSpanWide: boolean
  record: PropertyRecord | null
}

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
    listing: MarketplaceListing
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
  'toggle-saved': [property: PropertyRecord]
  'quick-view': [property: PropertyRecord]
  'toggle-compare': [property: PropertyRecord]
  highlight: [propertyId: string]
}>()

const isLowResolution = ref(false)

const effectiveImageRatio = computed(() =>
  isLowResolution.value &&
  (props.layout.desktopSpan === 2 ||
    props.layout.largeDesktopSpan === 2 ||
    props.layout.tabletSpan === 2 ||
    props.layout.mobileSpan === 2)
    ? '4 / 3'
    : props.layout.imageRatio
)

const metadata = computed(() => {
  if (props.layout.variant === 'office') {
    return [
      props.listing.shopSize
        ? { label: 'Floor area', value: props.listing.shopSize, icon: resizeOutline }
        : null,
      props.listing.parking > 0
        ? { label: 'Parking', value: String(props.listing.parking), icon: carOutline }
        : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item))
  }

  if (props.layout.variant !== 'property') {
    return []
  }

  return [
    props.listing.beds > 0
      ? { label: 'Bedrooms', value: String(props.listing.beds), icon: bedOutline }
      : null,
    props.listing.baths > 0
      ? { label: 'Bathrooms', value: String(props.listing.baths), icon: waterOutline }
      : null,
    props.listing.parking > 0
      ? { label: 'Parking spaces', value: String(props.listing.parking), icon: carOutline }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))
})

function handleImageLoad(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  isLowResolution.value = image.naturalWidth < 720 || image.naturalHeight < 480
}

function emitHighlight() {
  if (props.listing.id) {
    emit('highlight', props.listing.id)
  }
}
</script>

<style scoped>
.marketplace-card {
  grid-column: span 1;
  align-self: start;
}

.marketplace-card__body {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.marketplace-card__identity-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.marketplace-card__title,
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

.marketplace-card.marketplace-card--rendered-wide {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: visible;
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
}

.marketplace-card--rendered-wide .marketplace-card__body::before {
  position: absolute;
  z-index: -1;
  inset: -88px 0 0;
  border-radius: 0 0 18px 18px;
  background: linear-gradient(
    180deg,
    rgb(15 23 42 / 0) 0%,
    rgb(15 23 42 / 0.3) 42%,
    rgb(8 15 28 / 0.72) 100%
  );
  content: '';
  pointer-events: none;
}

.marketplace-card--rendered-wide .marketplace-card__title,
.marketplace-card--rendered-wide .marketplace-card__location,
.marketplace-card--rendered-wide .marketplace-card__metadata,
.marketplace-card--rendered-wide .marketplace-card__price,
.marketplace-card--rendered-wide .marketplace-card__period {
  color: white;
}

.marketplace-card--rendered-wide .marketplace-card__location,
.marketplace-card--rendered-wide .marketplace-card__period {
  color: rgb(255 255 255 / 0.82);
}

.marketplace-card--rendered-wide .marketplace-card__title,
.marketplace-card--rendered-wide .marketplace-card__location,
.marketplace-card--rendered-wide .marketplace-card__metadata,
.marketplace-card--rendered-wide .marketplace-card__price {
  text-shadow: 0 1px 2px rgb(2 6 23 / 0.58);
}

.marketplace-card--rendered-wide .marketplace-card__details {
  border: 1px solid rgb(255 255 255 / 0.52);
  background: rgb(255 255 255 / 0.92);
  color: rgb(15 23 42);
  backdrop-filter: blur(12px);
}

.marketplace-card--rendered-wide .marketplace-card__details:hover {
  background: white;
  color: rgb(15 23 42);
}

.marketplace-card--rendered-wide:has(.marketplace-card__quick-actions) .marketplace-card__price {
  max-width: calc(100% - 150px);
}

.marketplace-card--rendered-wide .marketplace-card__quick-actions {
  z-index: 4;
  right: 68px;
  bottom: 14px;
}

.marketplace-card--rendered-wide .marketplace-card__quick-actions button {
  border-color: rgb(255 255 255 / 0.38);
  background: rgb(15 23 42 / 0.68);
  color: white;
}

.marketplace-card--rendered-wide .marketplace-card__quick-actions button:hover,
.marketplace-card--rendered-wide .marketplace-card__quick-actions button.is-active {
  background: white;
  color: rgb(15 23 42);
}

.marketplace-card__quick-actions {
  position: absolute;
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
  border: 1px solid rgb(255 255 255 / 0.7);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.9);
  color: rgb(51 65 85);
  box-shadow: 0 10px 24px -16px rgb(15 23 42 / 0.65);
  backdrop-filter: blur(12px);
}

.marketplace-card__quick-actions button:hover,
.marketplace-card__quick-actions button.is-active {
  background: rgb(37 99 235);
  color: white;
}

.marketplace-card--emphasized .marketplace-card__title {
  font-size: 1.05rem;
}

.marketplace-card:hover .marketplace-card__details {
  transform: translateX(2px);
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

  .marketplace-card:not(.marketplace-card--mobile-wide) .marketplace-card__favorite {
    height: 2.75rem;
    width: 2.75rem;
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
  .marketplace-card__details,
  .marketplace-card__favorite {
    transition: none !important;
  }

  .marketplace-card:hover {
    transform: none;
  }

  .marketplace-card:hover img,
  .marketplace-card:hover .marketplace-card__details {
    transform: none;
  }
}
</style>
