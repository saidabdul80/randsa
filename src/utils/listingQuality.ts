import { resolveListingFormConfig } from '../config/listingFormConfig'
import type { PropertyFormInput } from '../types/property'

export interface ListingQualityCheck {
  id: string
  label: string
  complete: boolean
  blocking: boolean
}

export interface ListingQualityResult {
  score: number
  checks: ListingQualityCheck[]
  missingRequired: string[]
  suggestions: string[]
}

export function resolveListingQuality(value: PropertyFormInput): ListingQualityResult {
  const config = resolveListingFormConfig(value.category, value.propertyType)
  const hasCompleteLocation = Boolean(
    value.state.trim() && value.city.trim() && value.area.trim() && value.address.trim()
  )
  const hasCoordinates = value.latitude !== null && value.longitude !== null
  const hasUtilities = Boolean(value.water || value.electricity || value.security || value.parking)
  const hasCommercialAccess = Boolean(
    value.roadAccess ||
    value.marketArea ||
    value.electricityAvailability ||
    value.waterAccess ||
    value.security
  )

  const checks: ListingQualityCheck[] = [
    {
      id: 'title',
      label: 'Clear listing title',
      complete: value.title.trim().length >= 8,
      blocking: !value.title.trim(),
    },
    {
      id: 'description',
      label: 'Useful description',
      complete: value.description.trim().length >= 80,
      blocking: !value.description.trim(),
    },
    {
      id: 'pricing',
      label: 'Rental price',
      complete: value.rentPrice > 0,
      blocking: value.rentPrice <= 0,
    },
    {
      id: 'location',
      label: 'Complete address',
      complete: hasCompleteLocation,
      blocking: !hasCompleteLocation,
    },
    { id: 'map', label: 'Accurate map pin', complete: hasCoordinates, blocking: false },
    {
      id: 'phone',
      label: 'Contact phone',
      complete: Boolean(value.ownerPhone.trim()),
      blocking: !value.ownerPhone.trim(),
    },
    {
      id: 'cover',
      label: 'Cover image',
      complete: value.images.length > 0,
      blocking: value.images.length === 0,
    },
    {
      id: 'gallery',
      label: 'Three or more images',
      complete: value.images.length >= 3,
      blocking: false,
    },
    {
      id: 'amenities',
      label: 'Useful amenities',
      complete: value.amenities.length >= 2,
      blocking: false,
    },
  ]

  if (config.detailMode === 'residential') {
    const hasRoomCounts =
      value.bedrooms !== null && value.bathrooms !== null && value.toilets !== null
    checks.push(
      { id: 'rooms', label: 'Room counts', complete: hasRoomCounts, blocking: !hasRoomCounts },
      { id: 'utilities', label: 'Utilities and access', complete: hasUtilities, blocking: false }
    )
  }

  if (config.detailMode === 'commercial') {
    const needsSize = value.propertyType === 'Shop rent'
    checks.push(
      {
        id: 'commercial-size',
        label: 'Floor or shop size',
        complete: Boolean(value.shopSize.trim()),
        blocking: needsSize && !value.shopSize.trim(),
      },
      {
        id: 'commercial-access',
        label: 'Access and utilities',
        complete: hasCommercialAccess,
        blocking: false,
      }
    )
  }

  const completedChecks = checks.filter((check) => check.complete).length
  const score = checks.length ? Math.round((completedChecks / checks.length) * 100) : 0
  const missingRequired = checks.filter((check) => check.blocking).map((check) => check.label)
  const suggestions = checks
    .filter((check) => !check.complete && !check.blocking)
    .map((check) => check.label)

  return { score, checks, missingRequired, suggestions }
}
