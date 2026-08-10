<template>
  <div
    ref="gridRef"
    class="adaptive-marketplace-grid"
    :class="`adaptive-marketplace-grid--${displayMode}`"
    role="list"
    aria-label="Marketplace listings"
  >
    <MarketplaceListingCard
      v-for="item in resolvedListings"
      :key="item.listing.key"
      :listing="item.listing"
      :layout="item.layout"
      :is-saved="savedPropertyIds.has(item.listing.id)"
      :is-compared="
        Boolean(item.listing.propertyRecord && comparedPropertyIds?.has(item.listing.id))
      "
      :is-highlighted="item.listing.id === highlightedPropertyId"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { MarketplaceDiscoveryItem } from '../../types/marketplace'
import MarketplaceListingCard from './MarketplaceListingCard.vue'

type MarketplaceVariant = 'property' | 'car' | 'event' | 'horse' | 'office'
type ImageRatio = '16 / 9' | '3 / 2' | '4 / 3' | '1 / 1' | '4 / 5'

interface ListingLayout {
  variant: MarketplaceVariant
  desktopSpan: 1 | 2
  desktopPosition: 'left' | 'right' | null
  largeDesktopSpan: 1 | 2
  largeDesktopPosition: 'left' | 'right' | null
  tabletSpan: 1 | 2
  mobileSpan: 1 | 2
  imageRatio: ImageRatio
  emphasis: 'standard' | 'featured'
}

const props = withDefaults(
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

const gridRef = ref<HTMLElement | null>(null)
let cardResizeObserver: ResizeObserver | null = null
let layoutFrame: number | null = null

const resolvedListings = computed(() => {
  const wideLimit =
    props.listings.length < 4 ? 0 : Math.max(1, Math.round(props.listings.length * 0.2))
  const desktopWideCards = resolveWideCards(props.listings, 4, wideLimit)
  const largeDesktopWideCards = resolveWideCards(props.listings, 5, wideLimit)
  const narrowWideIndex = props.listings.findIndex((listing) => listing.canSpanWide)

  return props.listings.map((listing, index) => {
    const variant = resolveVariant(listing)
    const desktopPosition = desktopWideCards.get(index) ?? null
    const largeDesktopPosition = largeDesktopWideCards.get(index) ?? null
    const useDesktopWideLayout = desktopPosition !== null
    const useLargeDesktopWideLayout = largeDesktopPosition !== null
    const useNarrowWideLayout = index === narrowWideIndex && wideLimit > 0
    const usesAnyWideLayout =
      useDesktopWideLayout || useLargeDesktopWideLayout || useNarrowWideLayout

    return {
      listing,
      layout: {
        variant,
        desktopSpan: useDesktopWideLayout ? 2 : 1,
        desktopPosition,
        largeDesktopSpan: useLargeDesktopWideLayout ? 2 : 1,
        largeDesktopPosition,
        tabletSpan: useNarrowWideLayout ? 2 : 1,
        mobileSpan: useNarrowWideLayout ? 2 : 1,
        emphasis: usesAnyWideLayout ? 'featured' : 'standard',
        imageRatio: usesAnyWideLayout ? wideRatio(variant) : standardRatio(variant),
      } satisfies ListingLayout,
    }
  })
})

watch(
  () => props.listings.map((listing) => listing.key).join('|'),
  () => reconnectObserver(),
  { flush: 'post' }
)

onMounted(() => {
  reconnectObserver()
  window.addEventListener('resize', scheduleLayout, { passive: true })
})

onBeforeUnmount(() => {
  cardResizeObserver?.disconnect()
  window.removeEventListener('resize', scheduleLayout)
  if (layoutFrame !== null) window.cancelAnimationFrame(layoutFrame)
})

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

function resolveWideCards(
  listings: MarketplaceDiscoveryItem[],
  columnCount: 4 | 5,
  wideLimit: number
) {
  const wideCards = new Map<number, 'left' | 'right'>()
  if (!wideLimit) return wideCards

  const minimumGap = Math.max(4, Math.floor(listings.length / wideLimit))
  let columnCursor = 0
  let lastWideIndex = -minimumGap
  let placeOnLeft = true

  listings.forEach((listing, index) => {
    const desiredCursor = placeOnLeft ? 0 : columnCount - 2
    const canUseWideCard =
      listing.canSpanWide &&
      columnCursor === desiredCursor &&
      index - lastWideIndex >= minimumGap &&
      wideCards.size < wideLimit

    if (canUseWideCard) {
      wideCards.set(index, placeOnLeft ? 'left' : 'right')
      columnCursor = (columnCursor + 2) % columnCount
      lastWideIndex = index
      placeOnLeft = !placeOnLeft
      return
    }

    columnCursor = (columnCursor + 1) % columnCount
  })

  return wideCards
}

function wideRatio(variant: MarketplaceVariant): ImageRatio {
  if (variant === 'horse') return '4 / 5'
  if (variant === 'property' || variant === 'event') return '16 / 9'
  return '3 / 2'
}

function standardRatio(variant: MarketplaceVariant): ImageRatio {
  if (variant === 'horse') return '4 / 5'
  if (variant === 'car') return '3 / 2'
  if (variant === 'office') return '1 / 1'
  return '4 / 3'
}

async function reconnectObserver() {
  await nextTick()
  cardResizeObserver?.disconnect()

  if ('ResizeObserver' in window) {
    cardResizeObserver = new ResizeObserver(() => scheduleLayout())
    gridRef.value?.querySelectorAll<HTMLElement>('.marketplace-card').forEach((card) => {
      cardResizeObserver?.observe(card)
    })
  }

  scheduleLayout()
}

function scheduleLayout() {
  if (layoutFrame !== null) window.cancelAnimationFrame(layoutFrame)
  layoutFrame = window.requestAnimationFrame(() => {
    layoutFrame = null
    updateMasonryRows()
  })
}

function updateMasonryRows() {
  const grid = gridRef.value
  if (!grid) return

  const gridStyle = window.getComputedStyle(grid)
  const rowHeight = Number.parseFloat(gridStyle.gridAutoRows) || 1
  const itemGap = Number.parseFloat(gridStyle.getPropertyValue('--marketplace-masonry-gap')) || 16
  const columnCount =
    Number.parseInt(gridStyle.getPropertyValue('--marketplace-column-count'), 10) || 2

  const measurements = Array.from(
    grid.querySelectorAll<HTMLElement>('.marketplace-card'),
    (card) => {
      const cardLayout = resolveRenderedCardLayout(card, columnCount)
      const span = Math.min(cardLayout.span, columnCount)

      card.classList.remove('marketplace-card--masonry-filled')
      card.style.removeProperty('--marketplace-card-masonry-fill')
      card.classList.toggle('marketplace-card--rendered-wide', span === 2)
      card.style.gridColumn = `span ${span}`
      card.style.gridRow = 'auto'

      return { card, cardLayout, span }
    }
  ).map(({ card, cardLayout, span }) => {
    const cardHeight = card.getBoundingClientRect().height
    const rowSpan = Math.max(1, Math.ceil((cardHeight + itemGap) / rowHeight))
    return { card, cardLayout, span, rowSpan }
  })

  const columnEndRows = Array.from({ length: columnCount }, () => 1)
  const columnTailCards: Array<{ card: HTMLElement; span: number } | null> = Array.from(
    { length: columnCount },
    () => null
  )
  const cardPlacements = new Map<HTMLElement, { rowStart: number; rowSpan: number }>()
  const masonryFillRows = new Map<HTMLElement, number>()
  let columnCursor = 0

  measurements.forEach(({ card, cardLayout, span, rowSpan }) => {
    const columnStart = resolveMasonryColumnStart(
      cardLayout.position,
      span,
      columnCount,
      columnEndRows,
      columnCursor
    )
    const rowStart = Math.max(...columnEndRows.slice(columnStart, columnStart + span))
    const nextColumnEnd = rowStart + rowSpan

    if (span === 2) {
      for (let column = columnStart; column < columnStart + span; column += 1) {
        const missingRows = rowStart - columnEndRows[column]
        const tailCard = columnTailCards[column]

        if (missingRows > 0 && tailCard?.span === 1) {
          masonryFillRows.set(
            tailCard.card,
            Math.max(masonryFillRows.get(tailCard.card) ?? 0, missingRows)
          )
        }
      }
    }

    card.style.gridColumn = `${columnStart + 1} / span ${span}`
    card.style.gridRow = `${rowStart} / span ${rowSpan}`
    cardPlacements.set(card, { rowStart, rowSpan })

    for (let column = columnStart; column < columnStart + span; column += 1) {
      columnEndRows[column] = nextColumnEnd
      columnTailCards[column] = { card, span }
    }

    columnCursor = (columnStart + span) % columnCount
  })

  masonryFillRows.forEach((fillRows, card) => {
    const placement = cardPlacements.get(card)
    if (!placement) return

    card.classList.add('marketplace-card--masonry-filled')
    card.style.setProperty('--marketplace-card-masonry-fill', `${fillRows * rowHeight}px`)
    card.style.gridRow = `${placement.rowStart} / span ${placement.rowSpan + fillRows}`
  })
}

function resolveRenderedCardLayout(card: HTMLElement, columnCount: number) {
  if (card.dataset.lowResolution === 'true') {
    return { span: 1, position: null }
  }

  if (columnCount >= 5) {
    return {
      span: Number(card.dataset.largeDesktopSpan) || 1,
      position: card.dataset.largeDesktopPosition || null,
    }
  }

  if (columnCount === 4) {
    return {
      span: Number(card.dataset.desktopSpan) || 1,
      position: card.dataset.desktopPosition || null,
    }
  }

  if (columnCount === 3) {
    return { span: Number(card.dataset.tabletSpan) || 1, position: null }
  }

  return { span: Number(card.dataset.mobileSpan) || 1, position: null }
}

function resolveMasonryColumnStart(
  position: string | null,
  span: number,
  columnCount: number,
  columnEndRows: number[],
  columnCursor: number
) {
  const starts = Array.from({ length: columnCount - span + 1 }, (_, index) => index)
  const earliestRow = Math.min(
    ...starts.map((start) => Math.max(...columnEndRows.slice(start, start + span)))
  )
  const earliestStarts = starts.filter(
    (start) => Math.max(...columnEndRows.slice(start, start + span)) === earliestRow
  )
  const preferredStart = position === 'left' ? 0 : position === 'right' ? columnCount - span : null

  if (preferredStart !== null && earliestStarts.includes(preferredStart)) {
    return preferredStart
  }

  return earliestStarts.reduce((best, start) => {
    const bestDistance = (best - columnCursor + columnCount) % columnCount
    const startDistance = (start - columnCursor + columnCount) % columnCount
    return startDistance < bestDistance ? start : best
  })
}
</script>

<style scoped>
.adaptive-marketplace-grid {
  --marketplace-column-count: 2;
  --marketplace-masonry-gap: 16px;

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-flow: row;
  grid-auto-rows: 1px;
  column-gap: 12px;
  row-gap: 0;
  align-items: start;
}

@media (min-width: 576px) {
  .adaptive-marketplace-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
  }
}

@media (min-width: 768px) {
  .adaptive-marketplace-grid {
    --marketplace-column-count: 3;

    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .adaptive-marketplace-grid--list {
    --marketplace-column-count: 1;

    grid-template-columns: minmax(0, 1fr);
  }
}

@media (min-width: 1024px) {
  .adaptive-marketplace-grid {
    --marketplace-column-count: 4;
    --marketplace-masonry-gap: 18px;

    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: 18px;
  }

  .adaptive-marketplace-grid--split {
    --marketplace-column-count: 2;

    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1255px) {
  .adaptive-marketplace-grid {
    --marketplace-column-count: 5;

    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .adaptive-marketplace-grid--list {
    --marketplace-column-count: 1;

    grid-template-columns: minmax(0, 1fr);
  }

  .adaptive-marketplace-grid--split {
    --marketplace-column-count: 2;

    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
