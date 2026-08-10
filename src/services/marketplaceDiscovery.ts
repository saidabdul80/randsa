import { getMarketplaceCategory, getPropertySubcategoryId } from '../config/marketplaceCategories'
import type { ListingRecord, MarketplaceCategoryId } from '../types/listing'
import type {
  MarketplaceCardMetadata,
  MarketplaceDiscoveryFilters,
  MarketplaceDiscoveryItem,
} from '../types/marketplace'
import type { PropertyRecord } from '../types/property'

interface PropertyPresentationOverrides {
  key?: string
  image?: string
  price?: string
  canSpanWide?: boolean
  source?: 'property' | 'fallback'
}

const currencyFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

function compactParts(parts: readonly string[]) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part, index, values) => values.indexOf(part) === index)
    .join(', ')
}

function readableValue(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function addMetadata(
  entries: MarketplaceCardMetadata[],
  kind: MarketplaceCardMetadata['kind'],
  label: string,
  value: string | number | boolean | string[] | null | undefined
) {
  if (value === null || value === undefined || value === '' || value === false) return
  entries.push({ kind, label, value: readableValue(value) })
}

function legacyCategoryId(property: PropertyRecord): MarketplaceCategoryId {
  if (property.category === 'vehicle') return 'vehicles'
  if (property.category === 'event' || property.category === 'horse') return 'leisure-activities'
  return 'property'
}

function legacySubcategoryId(property: PropertyRecord, categoryId: MarketplaceCategoryId) {
  if (categoryId === 'property') return getPropertySubcategoryId(property.propertyType)
  if (categoryId === 'vehicles') return 'cars'
  if (property.category === 'horse') return 'horse-rentals'
  return 'event-spaces'
}

function legacyMetadata(property: PropertyRecord, categoryId: MarketplaceCategoryId) {
  const entries: MarketplaceCardMetadata[] = []
  if (categoryId === 'property') {
    addMetadata(entries, 'bedrooms', 'Bedrooms', property.bedrooms)
    addMetadata(entries, 'bathrooms', 'Bathrooms', property.bathrooms)
    addMetadata(entries, 'parking', 'Parking', property.parking ? 1 : null)
    if (!entries.length) addMetadata(entries, 'area', 'Floor area', property.shopSize)
  }
  return entries.slice(0, 3)
}

function listingMetadata(listing: ListingRecord) {
  const entries: MarketplaceCardMetadata[] = []
  const value = (key: string) => listing.attributes[key]

  if (listing.categoryId === 'property') {
    addMetadata(entries, 'bedrooms', 'Bedrooms', value('bedrooms'))
    addMetadata(entries, 'bathrooms', 'Bathrooms', value('bathrooms'))
    addMetadata(entries, 'parking', 'Parking', value('parkingSpaces'))
  } else if (listing.categoryId === 'vehicles') {
    addMetadata(entries, 'year', 'Year', value('year'))
    addMetadata(entries, 'transmission', 'Transmission', value('transmission'))
    addMetadata(entries, 'mileage', 'Mileage', value('mileage'))
  } else if (listing.categoryId === 'phones-tablets') {
    addMetadata(entries, 'brand', 'Brand', value('brand'))
    addMetadata(entries, 'storage', 'Storage', value('storage'))
    addMetadata(entries, 'condition', 'Condition', value('condition'))
  } else if (listing.categoryId === 'services' || listing.categoryId === 'repair-construction') {
    addMetadata(entries, 'service-area', 'Service area', value('serviceArea'))
    addMetadata(entries, 'delivery', 'Delivery', value('deliveryMode'))
    addMetadata(entries, 'condition', 'Experience', value('experienceLevel'))
  } else if (listing.categoryId === 'jobs' || listing.categoryId === 'seeking-work-cvs') {
    addMetadata(entries, 'employment', 'Employment', value('employmentType'))
    addMetadata(entries, 'workplace', 'Workplace', value('workplaceType'))
    addMetadata(entries, 'service-area', 'Preferred location', value('preferredLocation'))
  } else if (listing.categoryId === 'food-agriculture-farming') {
    const quantity = [value('quantity'), value('unit')].filter(Boolean).join(' ')
    addMetadata(entries, 'quantity', 'Quantity', quantity)
    addMetadata(entries, 'condition', 'Freshness', value('freshness'))
    addMetadata(entries, 'delivery', 'Sale type', value('saleType'))
  } else {
    addMetadata(entries, 'brand', 'Brand', value('brand'))
    addMetadata(entries, 'model', 'Model', value('model'))
    addMetadata(entries, 'condition', 'Condition', value('condition'))
  }

  return entries.slice(0, 3)
}

function listingPrice(listing: ListingRecord) {
  if (listing.pricing.priceType === 'free') return 'Free'
  if (listing.pricing.priceType === 'contact') return 'Contact for price'
  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: listing.pricing.currency || 'NGN',
    maximumFractionDigits: 0,
  }).format(listing.pricing.amount)
  if (listing.pricing.priceType === 'range' && listing.pricing.maximumAmount) {
    const maximum = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: listing.pricing.currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(listing.pricing.maximumAmount)
    return `${formatted} - ${maximum}`
  }
  return formatted
}

function listingAvailability(listing: ListingRecord) {
  if (listing.categoryId === 'jobs') return 'Open'
  if (['services', 'repair-construction', 'leisure-activities'].includes(listing.categoryId)) {
    return 'Bookable'
  }
  return 'Active'
}

export function propertyToMarketplaceItem(
  property: PropertyRecord,
  overrides: PropertyPresentationOverrides = {}
): MarketplaceDiscoveryItem {
  const categoryId = legacyCategoryId(property)
  const subcategoryId = legacySubcategoryId(property, categoryId)
  const category = getMarketplaceCategory(categoryId)
  return {
    key: overrides.key ?? `property-${property.id}`,
    id: property.id,
    source: overrides.source ?? 'property',
    saveSource: 'property',
    detailPath: `/properties/${property.id}`,
    title: property.title,
    description: property.description,
    categoryId,
    categoryName: category?.label ?? 'Property',
    subcategoryId,
    subcategoryName: property.propertyType,
    location: compactParts([property.area, property.city, property.state]),
    state: property.state,
    city: property.city,
    area: property.area,
    price: overrides.price ?? currencyFormatter.format(property.rentPrice),
    numericPrice: property.rentPrice,
    paymentDuration: property.paymentDuration.replace(/ly$/, ''),
    availabilityLabel: property.isAvailable ? 'Available' : 'Unavailable',
    availabilityTone: property.isAvailable ? 'available' : 'active',
    image: overrides.image ?? property.images[0] ?? '',
    canSpanWide: overrides.canSpanWide ?? Boolean(property.images[0]),
    metadata: legacyMetadata(property, categoryId),
    attributes: {
      propertyType: property.propertyType,
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 0,
      parkingSpaces: property.parking ? 1 : 0,
    },
    createdAt: property.createdAt,
    propertyRecord: property,
    listingRecord: null,
  }
}

export function listingToMarketplaceItem(listing: ListingRecord): MarketplaceDiscoveryItem {
  return {
    key: `listing-${listing.id}`,
    id: listing.id,
    source: 'listing',
    saveSource: 'listing',
    detailPath: `/listings/${listing.id}`,
    title: listing.title,
    description: listing.description,
    categoryId: listing.categoryId,
    categoryName: listing.categoryName,
    subcategoryId: listing.subcategoryId,
    subcategoryName: listing.subcategoryName,
    location: compactParts([listing.location.area, listing.location.city, listing.location.state]),
    state: listing.location.state,
    city: listing.location.city,
    area: listing.location.area,
    price: listingPrice(listing),
    numericPrice: listing.pricing.amount,
    paymentDuration: listing.pricing.billingPeriod,
    availabilityLabel: listingAvailability(listing),
    availabilityTone: ['services', 'repair-construction', 'leisure-activities'].includes(
      listing.categoryId
    )
      ? 'booking'
      : 'active',
    image: listing.media.coverImage,
    canSpanWide: Boolean(listing.media.coverImage),
    metadata: listingMetadata(listing),
    attributes: listing.attributes,
    createdAt: listing.publishedAt ?? listing.createdAt,
    propertyRecord: null,
    listingRecord: listing,
  }
}

function matchesText(item: MarketplaceDiscoveryItem, search: string) {
  if (!search) return true
  const haystack = [
    item.title,
    item.description,
    item.categoryName,
    item.subcategoryName,
    item.location,
    ...Object.values(item.attributes).flatMap((value) =>
      Array.isArray(value) ? value : [String(value)]
    ),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(search.toLowerCase())
}

function matchesDate(
  item: MarketplaceDiscoveryItem,
  value: MarketplaceDiscoveryFilters['datePosted']
) {
  if (value === 'all' || !item.createdAt) return true
  const timestamp = new Date(item.createdAt).getTime()
  if (Number.isNaN(timestamp)) return true
  const days = value === 'today' ? 1 : value === '7-days' ? 7 : 30
  return timestamp >= Date.now() - days * 24 * 60 * 60 * 1000
}

function stringAttribute(item: MarketplaceDiscoveryItem, key: string) {
  return String(item.attributes[key] ?? '').toLowerCase()
}

export function filterMarketplaceItems(
  items: readonly MarketplaceDiscoveryItem[],
  filters: MarketplaceDiscoveryFilters
) {
  return items.filter((item) => {
    if (!matchesText(item, filters.search.trim())) return false
    if (filters.categoryId !== 'all' && item.categoryId !== filters.categoryId) return false
    if (filters.subcategoryId && item.subcategoryId !== filters.subcategoryId) return false
    if (filters.minPrice !== null && item.numericPrice < filters.minPrice) return false
    if (filters.maxPrice !== null && item.numericPrice > filters.maxPrice) return false
    if (!matchesDate(item, filters.datePosted)) return false
    if (filters.condition && stringAttribute(item, 'condition') !== filters.condition) return false

    if (filters.categoryId === 'property') {
      if (filters.propertyType && stringAttribute(item, 'propertyType') !== filters.propertyType)
        return false
      if (
        filters.listingPurpose &&
        stringAttribute(item, 'listingPurpose') !== filters.listingPurpose
      )
        return false
      if (filters.bedrooms !== null && Number(item.attributes.bedrooms ?? 0) < filters.bedrooms)
        return false
      if (filters.furnishing && stringAttribute(item, 'furnishing') !== filters.furnishing)
        return false
    }

    if (filters.categoryId === 'vehicles') {
      if (filters.make && !stringAttribute(item, 'make').includes(filters.make.toLowerCase()))
        return false
      if (filters.model && !stringAttribute(item, 'model').includes(filters.model.toLowerCase()))
        return false
      if (filters.minimumYear !== null && Number(item.attributes.year ?? 0) < filters.minimumYear)
        return false
      if (filters.transmission && stringAttribute(item, 'transmission') !== filters.transmission)
        return false
    }

    if (filters.categoryId === 'phones-tablets') {
      if (filters.brand && !stringAttribute(item, 'brand').includes(filters.brand.toLowerCase()))
        return false
      if (
        filters.storage &&
        !stringAttribute(item, 'storage').includes(filters.storage.toLowerCase())
      )
        return false
    }
    return true
  })
}
