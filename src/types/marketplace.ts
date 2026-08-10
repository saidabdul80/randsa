import type { ListingRecord, MarketplaceCategoryId } from './listing'
import type { PropertyRecord } from './property'

export type MarketplaceItemSource = 'property' | 'listing' | 'fallback'
export type MarketplaceSaveSource = 'property' | 'listing'

export type MarketplaceMetadataKind =
  | 'area'
  | 'bathrooms'
  | 'bedrooms'
  | 'brand'
  | 'condition'
  | 'delivery'
  | 'employment'
  | 'mileage'
  | 'model'
  | 'parking'
  | 'quantity'
  | 'service-area'
  | 'storage'
  | 'transmission'
  | 'workplace'
  | 'year'

export interface MarketplaceCardMetadata {
  kind: MarketplaceMetadataKind
  label: string
  value: string
}

export interface MarketplaceDiscoveryItem {
  key: string
  id: string
  source: MarketplaceItemSource
  saveSource: MarketplaceSaveSource
  detailPath: string
  title: string
  description: string
  categoryId: MarketplaceCategoryId
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  location: string
  state: string
  city: string
  area: string
  price: string
  numericPrice: number
  paymentDuration: string
  availabilityLabel: string
  availabilityTone: 'available' | 'booking' | 'active'
  image: string
  canSpanWide: boolean
  metadata: MarketplaceCardMetadata[]
  attributes: Record<string, string | number | boolean | string[]>
  createdAt: string
  propertyRecord: PropertyRecord | null
  listingRecord: ListingRecord | null
}

export type MarketplaceCategoryFilter = MarketplaceCategoryId | 'all'
export type MarketplaceDateFilter = 'all' | 'today' | '7-days' | '30-days'

export interface MarketplaceDiscoveryFilters {
  search: string
  categoryId: MarketplaceCategoryFilter
  subcategoryId: string
  minPrice: number | null
  maxPrice: number | null
  datePosted: MarketplaceDateFilter
  condition: string
  propertyType: string
  listingPurpose: string
  bedrooms: number | null
  furnishing: string
  make: string
  model: string
  minimumYear: number | null
  transmission: string
  brand: string
  storage: string
}

export function createDefaultMarketplaceFilters(): MarketplaceDiscoveryFilters {
  return {
    search: '',
    categoryId: 'all',
    subcategoryId: '',
    minPrice: null,
    maxPrice: null,
    datePosted: 'all',
    condition: '',
    propertyType: '',
    listingPurpose: '',
    bedrooms: null,
    furnishing: '',
    make: '',
    model: '',
    minimumYear: null,
    transmission: '',
    brand: '',
    storage: '',
  }
}
