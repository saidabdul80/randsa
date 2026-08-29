<template>
  <div
    class="marketplace-grid"
    :class="`marketplace-grid--${displayMode}`"
    role="list"
    aria-label="Marketplace listings"
  >
    <MarketplaceListingCard
      v-for="(listing, index) in listings"
      :key="listing.key"
      :listing="listing"
      :variant="resolveVariant(listing)"
      :emphasis="emphasisFor(index)"
      :is-saved="savedPropertyIds.has(listing.id)"
      :is-compared="Boolean(listing.propertyRecord && comparedPropertyIds?.has(listing.id))"
      :is-highlighted="listing.id === highlightedPropertyId"
      :is-saving="isSaving"
      :show-listing-actions="showListingActions"
      :display-mode="displayMode"
      @toggle-saved="$emit('toggle-saved', $event)"
      @quick-view="$emit('quick-view', $event)"
      @toggle-compare="$emit('toggle-compare', $event)"
      @highlight="$emit('highlight', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { MarketplaceDiscoveryItem } from '../../types/marketplace'
import MarketplaceListingCard from './MarketplaceListingCard.vue'

export type MarketplaceVariant = 'property' | 'car' | 'event' | 'horse' | 'office'
export type CardEmphasis = 'standard' | 'wide' | 'feature'

/*
 * An editorial mosaic on a fixed row rhythm.
 *
 * Three tile sizes on a repeating 11-card cadence:
 *   feature  2 columns x 2 rows  - the hero tile
 *   wide     2 columns x 1 row   - the mid-weight tile
 *   standard 1 column  x 1 row   - everything else
 *
 * The rows are a fixed height (`grid-auto-rows`), so a 2-row tile is exactly twice a
 * 1-row tile plus the gap and every row edge still lines up. `grid-auto-flow: dense`
 * backfills the gaps a large tile leaves behind, so the wall stays solid at any column
 * count without the per-card measuring the old ResizeObserver masonry needed.
 */
const CADENCE = 11
const FEATURE_SLOT = 0
const WIDE_SLOT = 6

withDefaults(
  defineProps<{
    listings: MarketplaceDiscoveryItem[]
    savedPropertyIds: Set<string>
    comparedPropertyIds?: Set<string>
    highlightedPropertyId?: string
    isSaving: boolean
    showListingActions?: boolean
    displayMode?: 'grid' | 'list' | 'split'
  }>(),
  {
    comparedPropertyIds: undefined,
    highlightedPropertyId: '',
    showListingActions: false,
    displayMode: 'grid',
  }
)

defineEmits<{
  'toggle-saved': [item: MarketplaceDiscoveryItem]
  'quick-view': [item: MarketplaceDiscoveryItem]
  'toggle-compare': [item: MarketplaceDiscoveryItem]
  highlight: [propertyId: string]
}>()

function emphasisFor(index: number): CardEmphasis {
  const slot = index % CADENCE
  if (slot === FEATURE_SLOT) return 'feature'
  if (slot === WIDE_SLOT) return 'wide'
  return 'standard'
}

/** Variant only picks the placeholder icon; it no longer influences layout. */
function resolveVariant(listing: MarketplaceDiscoveryItem): MarketplaceVariant {
  const identity = `${listing.subcategoryName} ${listing.title}`.toLowerCase()

  if (listing.categoryId === 'vehicles') return 'car'
  if (listing.categoryId === 'leisure-activities') {
    return /\b(horse|equestrian)\b/.test(identity) ? 'horse' : 'event'
  }
  if (listing.categoryId !== 'property') return 'property'
  if (/\b(car|vehicle|suv|sedan)\b/.test(identity)) return 'car'
  if (/\b(event|venue|hall|marquee)\b/.test(identity)) return 'event'
  if (/\b(horse|equestrian)\b/.test(identity)) return 'horse'
  if (/\b(shop|office|commercial)\b/.test(identity)) return 'office'

  return 'property'
}
</script>

<style scoped>
.marketplace-grid {
  --grid-row-height: 172px;

  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  /* Fixed rows are what keep every tile edge aligned across the mosaic. */
  grid-auto-rows: var(--grid-row-height);
  grid-auto-flow: row dense;
}

/* Tile spans. The card component sets the matching class on itself. */
.marketplace-grid :deep(.listing-card--wide) {
  grid-column: span 2;
}

.marketplace-grid :deep(.listing-card--feature) {
  grid-column: span 2;
  grid-row: span 2;
}

@media (min-width: 640px) {
  .marketplace-grid {
    --grid-row-height: 184px;

    gap: 18px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .marketplace-grid {
    --grid-row-height: 172px;

    gap: 20px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1440px) {
  .marketplace-grid {
    --grid-row-height: 168px;

    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

/*
 * Below 640px there are only two columns, so a 2x2 feature would swallow the whole
 * viewport. Features stay full width but drop to a single row, and wide tiles become
 * ordinary ones.
 */
@media (max-width: 639px) {
  .marketplace-grid {
    --grid-row-height: 164px;
  }

  .marketplace-grid :deep(.listing-card--feature) {
    grid-row: span 1;
  }
}

/* Single-column reading list: no mosaic, every tile equal. */
.marketplace-grid--list {
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: auto;
}

.marketplace-grid--list :deep(.listing-card--wide),
.marketplace-grid--list :deep(.listing-card--feature) {
  grid-column: span 1;
  grid-row: span 1;
}

@media (min-width: 1024px) {
  .marketplace-grid--split {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
