import type { ListingStatus } from '../../types/listing'

export type ManageListingStatus = ListingStatus | 'approved' | 'pending'
export type ManageListingAction = ListingStatus | 'delete'

export interface ManageListingItem {
  id: string
  source: 'listing' | 'property'
  title: string
  category: string
  location: string
  price: string
  image: string
  status: ManageListingStatus
  views: number
  favourites: number
  mediaCount: number
  updatedAt: string
  updatedLabel: string
}

export function listingStatusLabel(status: ManageListingStatus) {
  if (status === 'approved') return 'Active'
  if (status === 'pending' || status === 'pending_review') return 'In review'
  if (status === 'sold') return 'Sold'
  if (status === 'rented') return 'Rented'
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function listingStatusTone(status: ManageListingStatus) {
  if (status === 'active' || status === 'approved') return 'active'
  if (status === 'pending' || status === 'pending_review') return 'review'
  if (status === 'sold' || status === 'rented' || status === 'completed') return 'completed'
  if (status === 'rejected') return 'rejected'
  if (status === 'paused') return 'paused'
  return 'neutral'
}

export function listingViewRoute(item: ManageListingItem) {
  return item.source === 'property' ? `/properties/${item.id}` : `/listings/${item.id}`
}

export function listingEditRoute(item: ManageListingItem) {
  return item.source === 'property' ? `/edit-property/${item.id}` : `/edit-listing/${item.id}`
}
