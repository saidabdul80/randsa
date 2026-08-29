<template>
  <article
    role="listitem"
    class="listing-card"
    :class="[
      `listing-card--${emphasis}`,
      {
        'listing-card--highlighted': isHighlighted,
        'listing-card--row': displayMode === 'list',
      },
    ]"
    :data-property-id="listing.id"
    @mouseenter="emitHighlight"
    @mouseleave="$emit('highlight', '')"
    @focusin="emitHighlight"
  >
    <!-- Stretched link: the whole tile is the target, inner buttons sit above it. -->
    <RouterLink
      :to="listing.detailPath"
      class="listing-card__link"
      :aria-label="`View details for ${listing.title}`"
    >
      <span class="rd-sr-only">View details for {{ listing.title }}</span>
    </RouterLink>

    <div class="listing-card__media">
      <img
        v-if="listing.image"
        :src="listing.image"
        :alt="`${listing.title} in ${listing.location}`"
        class="listing-card__image"
        :loading="emphasis === 'feature' ? 'eager' : 'lazy'"
        decoding="async"
      />
      <div v-else class="listing-card__placeholder" aria-hidden="true">
        <ion-icon :icon="emptyStateIcon" />
      </div>

      <!-- Overlay tiles print their copy on the photo, so they need their own scrim. -->
      <span v-if="isOverlay" class="listing-card__veil" aria-hidden="true"></span>

      <span v-if="statusBadgeLabel" class="listing-card__status" :class="statusToneClass">
        {{ statusBadgeLabel }}
      </span>

      <button
        v-if="listing.id"
        type="button"
        class="listing-card__save"
        :class="{ 'listing-card__save--on': isSaved }"
        :aria-label="isSaved ? `Remove ${listing.title} from saved` : `Save ${listing.title}`"
        :aria-pressed="isSaved"
        :disabled="isSaving"
        @click.stop.prevent="$emit('toggle-saved', listing)"
      >
        <ion-icon :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
      </button>

      <div v-if="showListingActions" class="listing-card__actions">
        <button
          type="button"
          :aria-label="`Quick view ${listing.title}`"
          title="Quick view"
          @click.stop.prevent="$emit('quick-view', listing)"
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
          @click.stop.prevent="$emit('toggle-compare', listing)"
        >
          <ion-icon :icon="gitCompareOutline" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="listing-card__body">
      <p v-if="emphasis === 'feature'" class="listing-card__eyebrow">
        <span class="listing-card__eyebrow-rule" aria-hidden="true"></span>Featured
      </p>

      <p class="listing-card__location">
        <ion-icon :icon="locationOutline" aria-hidden="true" />
        <span>{{ listing.location }}</span>
      </p>

      <h3 class="listing-card__title">{{ listing.title }}</h3>

      <ul v-if="visibleMetadata.length" class="listing-card__meta">
        <li v-for="item in visibleMetadata" :key="item.label" :title="item.label">
          <ion-icon :icon="metadataIcon(item.kind)" aria-hidden="true" />
          <span>{{ item.value }}</span>
          <span class="rd-sr-only">{{ item.label }}</span>
        </li>
      </ul>

      <!-- margin-top:auto pins the price to the bottom so prices align across a row. -->
      <p class="listing-card__price">
        <span class="listing-card__amount">{{ listing.price }}</span>
        <span v-if="listing.paymentDuration" class="listing-card__period">
          / {{ listing.paymentDuration }}
        </span>
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
  heartOutline,
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
import type { CardEmphasis, MarketplaceVariant } from './AdaptiveMarketplaceGrid.vue'

const props = withDefaults(
  defineProps<{
    listing: MarketplaceDiscoveryItem
    variant?: MarketplaceVariant
    emphasis?: CardEmphasis
    isSaved: boolean
    isCompared?: boolean
    isHighlighted?: boolean
    isSaving: boolean
    showListingActions?: boolean
    displayMode?: 'grid' | 'list' | 'split'
  }>(),
  {
    variant: 'property',
    emphasis: 'standard',
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

/** Feature and wide tiles print copy over the photo instead of below it. */
const isOverlay = computed(() => props.emphasis !== 'standard' && props.displayMode !== 'list')

const usesDirectBooking = computed(() => {
  if (props.listing.propertyRecord) {
    return !isInspectionMode(resolveBookingMode(props.listing.propertyRecord))
  }

  return props.listing.availabilityTone === 'booking'
})

/* The old card showed a bare "A" or "B", which told a shopper nothing. */
const statusBadgeLabel = computed(() => {
  if (props.listing.propertyRecord) return usesDirectBooking.value ? 'Book now' : 'Inspect'
  return props.listing.availabilityLabel
})

const statusToneClass = computed(() => {
  const tone = props.listing.propertyRecord
    ? usesDirectBooking.value
      ? 'booking'
      : 'available'
    : props.listing.availabilityTone

  return `listing-card__status--${tone ?? 'neutral'}`
})

const emptyStateIcon = computed(
  () => getMarketplaceCategory(props.listing.categoryId)?.icon ?? storefrontOutline
)

// The larger tiles have room for more detail; standard tiles stay terse.
const visibleMetadata = computed(() =>
  props.listing.metadata.slice(0, props.emphasis === 'feature' ? 4 : 3)
)

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

function emitHighlight() {
  emit('highlight', props.listing.id)
}
</script>

<style scoped>
.listing-card {
  position: relative;
  display: flex;
  /* Fills whatever grid area the mosaic assigns, so tile edges stay aligned. */
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--rd-hairline);
  border-radius: var(--rd-radius);
  background: var(--rd-surface);
  isolation: isolate;
  transition:
    border-color 240ms ease,
    box-shadow 240ms ease,
    transform 240ms cubic-bezier(0.33, 0, 0.2, 1);
}

.listing-card:hover {
  border-color: var(--rd-border-strong);
  box-shadow: var(--rd-shadow);
  transform: translateY(-3px);
}

.listing-card--highlighted,
.listing-card:focus-within {
  border-color: var(--rd-brass);
}

.listing-card__link {
  position: absolute;
  z-index: 3;
  inset: 0;
  border-radius: inherit;
}

.listing-card__link:focus-visible {
  outline: 2px solid var(--rd-brass);
  outline-offset: -3px;
}

/* ---------- media ---------- */

.listing-card__media {
  position: relative;
  /* Grows into the leftover height, which is what makes 1-row and 2-row tiles agree. */
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: var(--rd-surface-sunken);
}

.listing-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 700ms cubic-bezier(0.33, 0, 0.2, 1);
}

.listing-card:hover .listing-card__image {
  transform: scale(1.05);
}

.listing-card__placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: var(--rd-subtle);
  font-size: 34px;
}

.listing-card__veil {
  position: absolute;
  z-index: 1;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(7, 10, 15, 0.92) 0%,
    rgba(7, 10, 15, 0.5) 38%,
    rgba(7, 10, 15, 0.06) 70%
  );
}

/* ---------- overlays ---------- */

.listing-card__status {
  position: absolute;
  z-index: 4;
  top: 10px;
  left: 10px;
  border-radius: var(--rd-radius-pill);
  backdrop-filter: blur(8px);
  background: rgba(11, 14, 19, 0.72);
  padding: 5px 10px;
  color: var(--rd-plate-ink);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.listing-card__status--booking {
  background: rgba(150, 34, 60, 0.88);
}

.listing-card__status--available {
  background: rgba(29, 99, 73, 0.88);
}

.listing-card__save,
.listing-card__actions button {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  backdrop-filter: blur(8px);
  background: rgba(11, 14, 19, 0.55);
  color: var(--rd-plate-ink);
  font-size: 16px;
  cursor: pointer;
  transition:
    background-color 200ms ease,
    color 200ms ease,
    transform 200ms ease;
}

/* Extends the tap target to 44px without changing the visual size. */
.listing-card__save::after,
.listing-card__actions button::after {
  position: absolute;
  inset: -4px;
  content: '';
}

.listing-card__save {
  position: absolute;
  z-index: 4;
  top: 10px;
  right: 10px;
}

.listing-card__save:hover,
.listing-card__actions button:hover {
  background: rgba(11, 14, 19, 0.8);
  transform: scale(1.08);
}

.listing-card__save--on {
  background: rgba(150, 34, 60, 0.9);
  color: #fff;
}

.listing-card__save:disabled {
  cursor: wait;
  opacity: 0.6;
}

.listing-card__actions {
  position: absolute;
  z-index: 4;
  right: 10px;
  bottom: 10px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.listing-card:hover .listing-card__actions,
.listing-card:focus-within .listing-card__actions {
  opacity: 1;
  transform: translateY(0);
}

.listing-card__actions button.is-active {
  background: var(--rd-brass);
  color: #fff;
}

/* ---------- body ---------- */

.listing-card__body {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px 14px;
}

.listing-card__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 2px;
  color: var(--rd-plate-accent);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.listing-card__eyebrow-rule {
  display: inline-block;
  width: 26px;
  height: 1px;
  background: currentColor;
}

.listing-card__location {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  margin: 0;
  color: var(--rd-subtle);
  font-size: 10px;
  font-weight: 600;
}

.listing-card__location ion-icon {
  flex: 0 0 auto;
  font-size: 13px;
}

.listing-card__location span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.listing-card__title {
  /* Two-line clamp keeps every tile's price on the same baseline. */
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--rd-ink);
  font-family: var(--rd-font-display);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.26;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.listing-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
  margin: 1px 0 0;
  padding: 0;
  list-style: none;
}

.listing-card__meta li {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  color: var(--rd-muted);
  font-size: 10px;
  font-weight: 600;
}

.listing-card__meta ion-icon {
  flex: 0 0 auto;
  color: var(--rd-subtle);
  font-size: 13px;
}

.listing-card__price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  border-top: 1px solid var(--rd-hairline);
  margin: 8px 0 0;
  padding-top: 9px;
}

.listing-card__amount {
  overflow: hidden;
  color: var(--rd-ink);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.listing-card__period {
  flex: 0 0 auto;
  color: var(--rd-subtle);
  font-size: 10px;
  font-weight: 600;
}

/* ==========================================================================
 * Overlay tiles - the mosaic's feature and wide boxes.
 * The photo fills the whole tile and the copy sits on the scrim.
 * ========================================================================== */

.listing-card--feature,
.listing-card--wide {
  border-color: transparent;
  background: var(--rd-plate);
}

.listing-card--feature .listing-card__media,
.listing-card--wide .listing-card__media {
  position: absolute;
  inset: 0;
}

.listing-card--feature .listing-card__body,
.listing-card--wide .listing-card__body {
  position: relative;
  z-index: 2;
  margin-top: auto;
  padding: 14px 16px 16px;
}

.listing-card--feature .listing-card__location,
.listing-card--wide .listing-card__location {
  color: rgba(248, 245, 240, 0.72);
}

.listing-card--feature .listing-card__title,
.listing-card--wide .listing-card__title {
  color: var(--rd-plate-ink);
}

.listing-card--feature .listing-card__meta li,
.listing-card--wide .listing-card__meta li {
  color: rgba(248, 245, 240, 0.82);
}

.listing-card--feature .listing-card__meta ion-icon,
.listing-card--wide .listing-card__meta ion-icon {
  color: rgba(248, 245, 240, 0.6);
}

.listing-card--feature .listing-card__price,
.listing-card--wide .listing-card__price {
  border-top-color: rgba(248, 245, 240, 0.22);
}

.listing-card--feature .listing-card__amount,
.listing-card--wide .listing-card__amount {
  color: var(--rd-plate-ink);
}

.listing-card--feature .listing-card__period,
.listing-card--wide .listing-card__period {
  color: rgba(248, 245, 240, 0.66);
}

/* The 2x2 hero tile earns a larger headline. */
.listing-card--feature .listing-card__title {
  font-size: clamp(18px, 1.45vw, 24px);
  -webkit-line-clamp: 3;
}

.listing-card--feature .listing-card__amount {
  font-size: 16px;
}

.listing-card--wide .listing-card__title {
  font-size: 16px;
}

/* ---------- list mode: no mosaic, a plain horizontal row ---------- */

@media (min-width: 640px) {
  .listing-card--row {
    flex-direction: row;
  }

  .listing-card--row .listing-card__media {
    position: relative;
    width: 260px;
    flex: 0 0 auto;
    inset: auto;
  }

  .listing-card--row .listing-card__body {
    flex: 1;
    justify-content: center;
    padding: 18px 20px;
  }

  .listing-card--row .listing-card__title {
    font-size: 18px;
  }
}

/* ---------- small screens ---------- */

@media (max-width: 639px) {
  .listing-card__body {
    padding: 10px 12px 12px;
  }

  .listing-card__title {
    font-size: 13.5px;
  }

  .listing-card--feature .listing-card__title {
    font-size: 18px;
    -webkit-line-clamp: 2;
  }

  .listing-card--feature .listing-card__body,
  .listing-card--wide .listing-card__body {
    padding: 14px 16px 16px;
  }

  /* Touch devices have no hover, so quick actions stay visible. */
  .listing-card__actions {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .listing-card,
  .listing-card__image,
  .listing-card__actions,
  .listing-card__save {
    transition: none;
  }

  .listing-card:hover,
  .listing-card:hover .listing-card__image {
    transform: none;
  }
}
</style>
