import type { UserRole } from './user'

export type PropertyStatus = 'pending' | 'approved' | 'rejected'
export type PropertyCategory =
  'residential' | 'commercial' | 'land' | 'vehicle' | 'event' | 'horse' | 'other'
export type PaymentDuration =
  | 'hourly'
  | 'daily'
  | 'per_session'
  | 'fixed'
  | 'monthly'
  | 'quarterly'
  | 'biannually'
  | 'yearly'
  | 'custom'
export type PropertySortOption = 'newest' | 'lowest-price' | 'highest-price'
export type PropertyKindFilter = 'all' | 'house' | 'shop'
export type AvailabilityFilter = 'all' | 'available' | 'unavailable'

export type PropertyType =
  | 'House rent'
  | 'Shop rent'
  | 'Office space'
  | 'Warehouse'
  | 'Apartment'
  | 'Self-contained'
  | 'Flat'
  | 'Duplex'
  | 'Land'
  | 'Car'
  | 'Vehicle'
  | 'Event space'
  | 'Event centre'
  | 'Horse rental'
  | 'Hotel or guest house'
  | 'Other property'
  | 'Other rental'

export type PropertyImageSource = 'local' | 'remote'

export interface PropertyVacationPeriod {
  startDate: string
  endDate: string
}

export interface PropertyBookingAgentSchedule {
  agentId: string
  workingDays: number[]
  startTime: string
  endTime: string
  slotIntervalMinutes: number
  inspectionDurationMinutes: number
  maximumInspectionsPerDay: number
  unavailableDates: string[]
  vacationPeriods: PropertyVacationPeriod[]
}

export interface PropertyAvailabilityConfig {
  agents: PropertyBookingAgentSchedule[]
  limitedRemainingCapacity: number
  blockedDates: string[]
  bufferMinutes: number | null
  minimumDurationMinutes: number | null
}

export interface PropertyImageInput {
  id: string
  source: PropertyImageSource
  previewUrl: string
  remoteUrl: string | null
  file: File | null
  fileName: string
  mimeType: string
  size: number
}

export interface PropertyRecord {
  id: string
  title: string
  description: string
  category: PropertyCategory
  propertyType: PropertyType
  rentPrice: number
  cautionFee: number
  agencyFee: number
  inspectionFee: number
  paymentDuration: PaymentDuration
  state: string
  city: string
  area: string
  address: string
  latitude: number | null
  longitude: number | null
  bedrooms: number | null
  bathrooms: number | null
  toilets: number | null
  shopSize: string
  roadAccess: boolean
  marketArea: boolean
  electricityAvailability: boolean
  security: boolean
  waterAccess: boolean
  kitchen: boolean
  parking: boolean
  water: boolean
  electricity: boolean
  amenities: string[]
  images: string[]
  ownerId: string
  ownerRole: UserRole
  ownerPhone: string
  status: PropertyStatus
  isAvailable: boolean
  availabilityConfig: PropertyAvailabilityConfig
  createdAt: string
  updatedAt: string
}

export interface PropertyFormInput {
  title: string
  description: string
  category: PropertyCategory
  propertyType: PropertyType
  rentPrice: number
  cautionFee: number
  agencyFee: number
  inspectionFee: number
  paymentDuration: PaymentDuration
  state: string
  city: string
  area: string
  address: string
  latitude: number | null
  longitude: number | null
  bedrooms: number | null
  bathrooms: number | null
  toilets: number | null
  shopSize: string
  roadAccess: boolean
  marketArea: boolean
  electricityAvailability: boolean
  security: boolean
  waterAccess: boolean
  kitchen: boolean
  parking: boolean
  water: boolean
  electricity: boolean
  amenities: string[]
  images: PropertyImageInput[]
  ownerPhone: string
  isAvailable: boolean
  availabilityConfig: PropertyAvailabilityConfig
}

export interface PropertyFilterState {
  search: string
  area: string
  city: string
  propertyType: PropertyType | 'all'
  minPrice: number | null
  maxPrice: number | null
  kind: PropertyKindFilter
  bedrooms: number | null
  availability: AvailabilityFilter
  sortBy: PropertySortOption
}

export interface PropertyContactLinks {
  call: string
  whatsapp: string
}

export const MAX_PROPERTY_IMAGES = 6
export const PROPERTY_IMAGE_TARGET_MAX_BYTES = 500 * 1024
export const PROPERTY_IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024
export const PROPERTY_IMAGE_MAX_DIMENSION = 1600

export function createEmptyPropertyInput(): PropertyFormInput {
  return {
    title: '',
    description: '',
    category: 'residential',
    propertyType: 'House rent',
    rentPrice: 0,
    cautionFee: 0,
    agencyFee: 0,
    inspectionFee: 0,
    paymentDuration: 'yearly',
    state: '',
    city: '',
    area: '',
    address: '',
    latitude: null,
    longitude: null,
    bedrooms: null,
    bathrooms: null,
    toilets: null,
    shopSize: '',
    roadAccess: false,
    marketArea: false,
    electricityAvailability: false,
    security: false,
    waterAccess: false,
    kitchen: false,
    parking: false,
    water: false,
    electricity: false,
    amenities: [],
    images: [],
    ownerPhone: '',
    isAvailable: true,
    availabilityConfig: {
      agents: [],
      limitedRemainingCapacity: 3,
      blockedDates: [],
      bufferMinutes: null,
      minimumDurationMinutes: null,
    },
  }
}

export function createDefaultPropertyFilters(): PropertyFilterState {
  return {
    search: '',
    area: '',
    city: '',
    propertyType: 'all',
    minPrice: null,
    maxPrice: null,
    kind: 'all',
    bedrooms: null,
    availability: 'all',
    sortBy: 'newest',
  }
}

export const residentialPropertyTypes: PropertyType[] = [
  'House rent',
  'Apartment',
  'Self-contained',
  'Flat',
  'Duplex',
]

export function isShopProperty(propertyType: PropertyType) {
  return propertyType === 'Shop rent'
}

export function isHouseLikeProperty(propertyType: PropertyType) {
  return residentialPropertyTypes.includes(propertyType)
}

export function showsResidentialRoomFields(propertyType: PropertyType) {
  return residentialPropertyTypes.includes(propertyType)
}

export function allowsCommercialFieldGroup(propertyType: PropertyType) {
  return (
    propertyType === 'Shop rent' || propertyType === 'Office space' || propertyType === 'Warehouse'
  )
}

export function isListingCapableRole(role: UserRole | null | undefined) {
  return (
    role === 'user' ||
    role === 'tenant' ||
    role === 'landlord' ||
    role === 'agent' ||
    role === 'admin'
  )
}

export function isPropertyManagerRole(role: UserRole | null | undefined) {
  return isListingCapableRole(role)
}

export function buildPropertyContactLinks(phoneNumber: string): PropertyContactLinks {
  const sanitized = phoneNumber.replace(/[^\d+]/g, '')
  const whatsappNumber = sanitized.replace(/^\+/, '')

  return {
    call: sanitized ? `tel:${sanitized}` : '',
    whatsapp: whatsappNumber ? `https://wa.me/${whatsappNumber}` : '',
  }
}

export function createRemotePropertyImage(url: string): PropertyImageInput {
  const fileName = (() => {
    try {
      const parsedUrl = new URL(url)
      const pathname = decodeURIComponent(parsedUrl.pathname)
      return pathname.split('/').filter(Boolean).pop() ?? 'property-image'
    } catch {
      return 'property-image'
    }
  })()

  return {
    id: `remote-${crypto.randomUUID()}`,
    source: 'remote',
    previewUrl: url,
    remoteUrl: url,
    file: null,
    fileName,
    mimeType: 'image/*',
    size: 0,
  }
}
