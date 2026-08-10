import { getListingFieldConfig, isPhotoRequired } from '../config/listingFieldConfig'
import { getMarketplaceCategory } from '../config/marketplaceCategories'
import type { ListingAttributes, ListingFormInput } from '../types/listing'
import { getCoordinateValidationError, normalizeCoordinates } from '../utils/coordinates'

export function cleanListingAttributes(attributes: ListingAttributes) {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => {
      if (typeof value === 'string') return Boolean(value.trim())
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    })
  ) as ListingAttributes
}

export function sanitizeListingInput(input: ListingFormInput): ListingFormInput {
  const category = getMarketplaceCategory(input.categoryId)
  const subcategory = category?.subcategories.find((item) => item.id === input.subcategoryId)
  const coordinates = normalizeCoordinates(input.location.latitude, input.location.longitude)

  return {
    ...input,
    title: String(input.title ?? '').trim(),
    description: String(input.description ?? '').trim(),
    categoryName: category?.label ?? String(input.categoryName ?? '').trim(),
    subcategoryName: subcategory?.label ?? String(input.subcategoryName ?? '').trim(),
    location: {
      ...input.location,
      country: String(input.location.country ?? '').trim() || 'Nigeria',
      state: String(input.location.state ?? '').trim(),
      city: String(input.location.city ?? '').trim(),
      area: String(input.location.area ?? '').trim(),
      address: String(input.location.address ?? '').trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
    pricing: {
      ...input.pricing,
      currency:
        String(input.pricing.currency ?? 'NGN')
          .trim()
          .toUpperCase() || 'NGN',
      amount: Math.max(0, Number(input.pricing.amount) || 0),
      maximumAmount:
        input.pricing.maximumAmount == null
          ? null
          : Math.max(0, Number(input.pricing.maximumAmount) || 0),
      priceType: input.pricing.priceType ?? 'fixed',
      billingPeriod: String(input.pricing.billingPeriod ?? '').trim(),
      negotiable: input.pricing.negotiable ?? 'no',
    },
    images: input.images.slice(0, 12),
    videoUrl: String(input.videoUrl ?? '').trim(),
    contact: {
      ...input.contact,
      name: String(input.contact.name ?? '').trim(),
      phone: String(input.contact.phone ?? '').trim(),
      whatsappEnabled: Boolean(input.contact.whatsappEnabled),
      preferredMethod: input.contact.preferredMethod ?? 'phone',
    },
    delivery: {
      ...input.delivery,
      available: Boolean(input.delivery.available),
      pickupAvailable: Boolean(input.delivery.pickupAvailable),
      details: String(input.delivery.details ?? '').trim(),
    },
    attributes: cleanListingAttributes(input.attributes),
  }
}

function isEmptyAttribute(value: unknown) {
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'string') return !value.trim()
  return value === null || value === undefined
}

export function validateMarketplaceListing(input: ListingFormInput) {
  const value = sanitizeListingInput(input)
  const category = getMarketplaceCategory(value.categoryId)
  const subcategory = category?.subcategories.find((item) => item.id === value.subcategoryId)

  if (!category) return 'Choose a valid listing category.'
  if (!subcategory) return 'Choose a valid listing subcategory.'
  if (!value.title) return 'Add a listing title.'
  if (!value.description) return 'Add a clear listing description.'
  if (!value.location.state || !value.location.city) return 'Add the listing state and city.'
  const coordinateError = getCoordinateValidationError(
    input.location.latitude,
    input.location.longitude
  )
  if (coordinateError) return coordinateError
  if (!value.contact.name || !value.contact.phone) return 'Add a contact name and phone number.'

  const categoryFields = getListingFieldConfig(value.categoryId, value.subcategoryId)
  const missingField = categoryFields.find(
    (field) => field.required && isEmptyAttribute(value.attributes[field.key])
  )
  if (missingField) return `Add ${missingField.label.toLowerCase()}.`

  const invalidNumberField = categoryFields.find((field) => {
    const attribute = value.attributes[field.key]
    if (field.type !== 'number' || isEmptyAttribute(attribute)) return false
    const numberValue = Number(attribute)
    return (
      !Number.isFinite(numberValue) ||
      (field.min !== undefined && numberValue < field.min) ||
      (field.max !== undefined && numberValue > field.max)
    )
  })
  if (invalidNumberField) return `Enter a valid ${invalidNumberField.label.toLowerCase()}.`

  if (isPhotoRequired(value.categoryId) && !value.images.length) {
    return 'Upload at least one clear photo for this category.'
  }
  if (!['free', 'contact'].includes(value.pricing.priceType) && value.pricing.amount <= 0) {
    return 'Enter a price greater than zero or choose free/contact for price.'
  }
  if (
    value.pricing.priceType === 'range' &&
    (!value.pricing.maximumAmount || value.pricing.maximumAmount < value.pricing.amount)
  ) {
    return 'Enter a valid maximum price for the range.'
  }
  if (
    value.videoUrl &&
    !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|facebook\.com|fb\.watch)\//i.test(value.videoUrl)
  ) {
    return 'Use a valid YouTube or Facebook video link.'
  }
  return ''
}
