export type MarketplaceCategoryId =
  | 'property'
  | 'vehicles'
  | 'phones-tablets'
  | 'electronics'
  | 'home-furniture-appliances'
  | 'fashion'
  | 'beauty-personal-care'
  | 'babies-kids'
  | 'food-agriculture-farming'
  | 'commercial-equipment-tools'
  | 'repair-construction'
  | 'services'
  | 'jobs'
  | 'seeking-work-cvs'
  | 'leisure-activities'
  | 'pets'

export interface MarketplaceSubcategory {
  id: string
  label: string
  description: string
  keywords: readonly string[]
}

export interface MarketplaceCategory {
  id: MarketplaceCategoryId
  label: string
  description: string
  icon: string
  keywords: readonly string[]
  subcategories: readonly MarketplaceSubcategory[]
}

export interface ListingClassification {
  categoryId: MarketplaceCategoryId | null
  subcategoryId: string | null
}

export interface ResolvedListingClassification {
  category: MarketplaceCategory
  subcategory: MarketplaceSubcategory
}

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'sold'
  | 'rented'
  | 'completed'
  | 'rejected'
  | 'expired'
  | 'deleted'

export type ListingModerationStatus = 'pending' | 'approved' | 'rejected'
export type ListingPriceType = 'fixed' | 'negotiable' | 'free' | 'contact' | 'range'
export type ListingNegotiable = 'yes' | 'no' | 'not_sure'
export type ListingContactMethod = 'phone' | 'whatsapp' | 'both' | 'email'
export type ListingAttributeValue = string | number | boolean | string[]
export type ListingAttributes = Record<string, ListingAttributeValue>

export interface ListingLocation {
  country: string
  state: string
  city: string
  area: string
  address: string
  latitude: number | null
  longitude: number | null
}

export interface ListingPricing {
  currency: string
  amount: number
  maximumAmount: number | null
  priceType: ListingPriceType
  billingPeriod: string
  negotiable: ListingNegotiable
}

export interface ListingMedia {
  coverImage: string
  images: string[]
  videoUrl: string
}

export interface ListingContact {
  name: string
  phone: string
  whatsappEnabled: boolean
  preferredMethod: ListingContactMethod
}

export interface ListingDelivery {
  available: boolean
  pickupAvailable: boolean
  details: string
}

export interface ListingMediaInput {
  id: string
  source: 'local' | 'remote'
  previewUrl: string
  remoteUrl: string | null
  file: File | null
  fileName: string
  mimeType: string
  size: number
}

export interface ListingFormInput {
  title: string
  description: string
  categoryId: MarketplaceCategoryId
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  location: ListingLocation
  pricing: ListingPricing
  images: ListingMediaInput[]
  videoUrl: string
  contact: ListingContact
  delivery: ListingDelivery
  attributes: ListingAttributes
  privateCvFile: File | null
}

export interface ListingRecord {
  id: string
  ownerId: string
  title: string
  description: string
  categoryId: MarketplaceCategoryId
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  status: ListingStatus
  moderationStatus: ListingModerationStatus
  location: ListingLocation
  pricing: ListingPricing
  media: ListingMedia
  contact: ListingContact
  delivery: ListingDelivery
  attributes: ListingAttributes
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  viewCount: number
  favouriteCount: number
}

export function createEmptyListingInput(
  category: MarketplaceCategory,
  subcategory: MarketplaceSubcategory,
  profile?: { fullName?: string; phone?: string; location?: string } | null
): ListingFormInput {
  return {
    title: '',
    description: '',
    categoryId: category.id,
    categoryName: category.label,
    subcategoryId: subcategory.id,
    subcategoryName: subcategory.label,
    location: {
      country: 'Nigeria',
      state: '',
      city: '',
      area: profile?.location?.trim() ?? '',
      address: '',
      latitude: null,
      longitude: null,
    },
    pricing: {
      currency: 'NGN',
      amount: 0,
      maximumAmount: null,
      priceType: 'fixed',
      billingPeriod: '',
      negotiable: 'no',
    },
    images: [],
    videoUrl: '',
    contact: {
      name: profile?.fullName?.trim() ?? '',
      phone: profile?.phone?.trim() ?? '',
      whatsappEnabled: false,
      preferredMethod: 'phone',
    },
    delivery: {
      available: false,
      pickupAvailable: true,
      details: '',
    },
    attributes: {},
    privateCvFile: null,
  }
}
