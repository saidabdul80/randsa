<template>
  <div ref="gridRef" class="adaptive-marketplace-grid" role="list" aria-label="Property listings">
    <MarketplaceListingCard
      v-for="item in resolvedListings"
      :key="item.listing.key"
      :listing="item.listing"
      :layout="item.layout"
      :is-saved="Boolean(item.listing.id && savedPropertyIds.has(item.listing.id))"
      :is-saving="isSaving"
      @toggle-saved="$emit('toggle-saved', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { PropertyRecord } from '../../types/property'
import MarketplaceListingCard from './MarketplaceListingCard.vue'

type MarketplaceVariant = 'property' | 'car' | 'event' | 'horse' | 'office'
type ImageRatio = '16 / 9' | '3 / 2' | '4 / 3' | '1 / 1' | '4 / 5'

interface MarketplaceListing {
  key: string
  id: string | null
  title: string
  location: string
  beds: number
  parking: number
  baths: number
  price: string
  numericPrice: number
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
  imageRatio: ImageRatio
  emphasis: 'standard' | 'featured'
}

const props = defineProps<{
  listings: MarketplaceListing[]
  savedPropertyIds: Set<string>
  isSaving: boolean
}>()

defineEmits<{
  'toggle-saved': [property: PropertyRecord]
}>()

const gridRef = ref<HTMLElement | null>(null)
let cardResizeObserver: ResizeObserver | null = null
let layoutFrame: number | null = null

const resolvedListings = computed(() => {
  const wideLimit = props.listings.length < 4
    ? 0
    : Math.max(1, Math.round(props.listings.length * 0.2))
  const desktopWideCards = resolveWideCards(props.listings, 4, wideLimit)
  const largeDesktopWideCards = resolveWideCards(props.listings, 5, wideLimit)
  const narrowWideIndex = props.listings.findIndex((listing) => listing.canSpanWide)

  return props.listings.map((listing, index) => {
    const variant = resolveVariant(`${listing.propertyType} ${listing.title}`.toLowerCase())
    const desktopPosition = desktopWideCards.get(index) ?? null
    const largeDesktopPosition = largeDesktopWideCards.get(index) ?? null
    const useDesktopWideLayout = desktopPosition !== null
    const useLargeDesktopWideLayout = largeDesktopPosition !== null
    const useNarrowWideLayout = index === narrowWideIndex && wideLimit > 0
    const usesAnyWideLayout = useDesktopWideLayout
      || useLargeDesktopWideLayout
      || useNarrowWideLayout

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
  { flush: 'post' },
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

function resolveVariant(identity: string): MarketplaceVariant {
  if (/\b(car|vehicle|suv|sedan)\b/.test(identity)) return 'car'
  if (/\b(event|venue|hall|marquee)\b/.test(identity)) return 'event'
  if (/\b(horse|equestrian)\b/.test(identity)) return 'horse'
  if (/\b(shop|office|commercial)\b/.test(identity)) return 'office'
  return 'property'
}

function resolveWideCards(
  listings: MarketplaceListing[],
  columnCount: 4 | 5,
  wideLimit: number,
) {
  const wideCards = new Map<number, 'left' | 'right'>()
  if (!wideLimit) return wideCards

  const minimumGap = Math.max(4, Math.floor(listings.length / wideLimit))
  let columnCursor = 0
  let lastWideIndex = -minimumGap
  let placeOnLeft = true

  listings.forEach((listing, index) => {
    const desiredCursor = placeOnLeft ? 0 : columnCount - 2
    const canUseWideCard = listing.canSpanWide
      && columnCursor === desiredCursor
      && index - lastWideIndex >= minimumGap
      && wideCards.size < wideLimit

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
  const rowHeight = Number.parseFloat(gridStyle.gridAutoRows) || 8
  const rowGap = Number.parseFloat(gridStyle.rowGap) || 16
  const columnCount = gridStyle.gridTemplateColumns.split(' ').filter(Boolean).length

  const measurements = Array.from(
    grid.querySelectorAll<HTMLElement>('.marketplace-card'),
    (card) => {
      const cardHeight = card.getBoundingClientRect().height
      const rowSpan = Math.max(1, Math.ceil((cardHeight + rowGap) / (rowHeight + rowGap)))
      return { card, rowSpan }
    },
  )

  const columnEndRows = Array.from({ length: columnCount }, () => 1)
  let columnCursor = 0

  measurements.forEach(({ card, rowSpan }) => {
    const cardLayout = resolveRenderedCardLayout(card, columnCount)
    const span = Math.min(cardLayout.span, columnCount)
    const columnStart = span === 2
      ? resolveWideColumnStart(cardLayout.position, columnCount, columnCursor)
      : columnCursor
    const rowStart = Math.max(...columnEndRows.slice(columnStart, columnStart + span))
    const nextColumnEnd = rowStart + rowSpan

    card.style.gridColumn = `${columnStart + 1} / span ${span}`
    card.style.gridRow = `${rowStart} / span ${rowSpan}`

    for (let column = columnStart; column < columnStart + span; column += 1) {
      columnEndRows[column] = nextColumnEnd
    }

    columnCursor = (columnStart + span) % columnCount
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

function resolveWideColumnStart(
  position: string | null,
  columnCount: number,
  columnCursor: number,
) {
  if (position === 'left') return 0
  if (position === 'right') return columnCount - 2
  return Math.min(columnCursor, columnCount - 2)
}
</script>

<style scoped>
.adaptive-marketplace-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-flow: row;
  grid-auto-rows: 8px;
  column-gap: 12px;
  row-gap: 16px;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .adaptive-marketplace-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: 18px;
    row-gap: 18px;
  }
}

@media (min-width: 1600px) {
  .adaptive-marketplace-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
