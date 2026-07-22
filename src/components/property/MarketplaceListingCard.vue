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
    }"
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
      >

      <div class="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
        <div class="flex min-w-0 flex-wrap gap-1.5">
          <span class="max-w-full truncate rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur-md dark:bg-slate-950/85 dark:text-white">
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
          :aria-label="isSaved ? `Remove ${listing.title} from saved properties` : `Save ${listing.title}`"
          :aria-pressed="isSaved"
          :disabled="isSaving"
          @click="$emit('toggle-saved', listing.record)"
        >
          <ion-icon :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="marketplace-card__body p-3.5 sm:p-4">
      <div class="flex min-w-0 items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="marketplace-card__title truncate text-sm font-extrabold tracking-normal text-ink dark:text-white sm:text-base">
            {{ listing.title }}
          </h3>
          <p class="marketplace-card__location mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-300 sm:text-xs">
            {{ listing.location }}
          </p>
        </div>
      </div>

      <div
        v-if="metadata.length"
        class="marketplace-card__metadata mt-3 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 sm:text-xs"
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

      <div class="mt-3.5 flex min-w-0 items-end justify-between gap-2">
        <p class="min-w-0 truncate text-sm font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-base">
          {{ listing.price }}
          <span class="text-[10px] font-medium text-slate-500 dark:text-slate-300 sm:text-[11px]">
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

const props = defineProps<{
  listing: MarketplaceListing
  layout: ListingLayout
  isSaved: boolean
  isSaving: boolean
}>()

defineEmits<{
  'toggle-saved': [property: PropertyRecord]
}>()

const isLowResolution = ref(false)

const effectiveImageRatio = computed(() => (
  isLowResolution.value && (
    props.layout.desktopSpan === 2
    || props.layout.largeDesktopSpan === 2
    || props.layout.tabletSpan === 2
    || props.layout.mobileSpan === 2
  )
    ? '4 / 3'
    : props.layout.imageRatio
))

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
</script>

<style scoped>
.marketplace-card {
  grid-column: span 1;
  align-self: start;
}

.marketplace-card--low-resolution {
  grid-column: span 1 !important;
}

.marketplace-card--emphasized .marketplace-card__title {
  font-size: 1.05rem;
}

.marketplace-card:hover .marketplace-card__details {
  transform: translateX(2px);
}

@media (min-width: 1024px) and (max-width: 1599px) {
  .marketplace-card--desktop-wide-left {
    grid-column: 1 / span 2;
  }

  .marketplace-card--desktop-wide-right {
    grid-column: 3 / span 2;
  }
}

@media (min-width: 1600px) {
  .marketplace-card--large-desktop-wide-left {
    grid-column: 1 / span 2;
  }

  .marketplace-card--large-desktop-wide-right {
    grid-column: 4 / span 2;
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
