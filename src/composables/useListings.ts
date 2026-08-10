import { computed, ref } from 'vue'

import {
  createListing,
  getListingById,
  listAllMarketplaceListings,
  listPublicListings,
  listOwnedListings,
  removeListing,
  reviewMarketplaceListing,
  setListingStatus,
  updateListing,
} from '../services/listings'
import type { ListingFormInput, ListingRecord, ListingStatus } from '../types/listing'
import type { UserProfile } from '../types/user'

const ownedListings = ref<ListingRecord[]>([])
const publicListings = ref<ListingRecord[]>([])
const allListings = ref<ListingRecord[]>([])
const isLoading = ref(false)
const error = ref('')

export function useListings() {
  async function refreshAll() {
    isLoading.value = true
    error.value = ''
    try {
      allListings.value = await listAllMarketplaceListings()
      return allListings.value
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not load listings for review.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function refreshPublic(maximumResults = 60) {
    isLoading.value = true
    error.value = ''
    try {
      publicListings.value = await listPublicListings(maximumResults)
      return publicListings.value
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not load marketplace listings.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function refreshOwned(ownerId: string) {
    isLoading.value = true
    error.value = ''
    try {
      ownedListings.value = await listOwnedListings(ownerId)
      return ownedListings.value
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not load your listings.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function saveNew(
    input: ListingFormInput,
    owner: UserProfile,
    onProgress?: (percent: number) => void
  ) {
    isLoading.value = true
    error.value = ''
    try {
      const record = await createListing(input, owner, onProgress)
      await refreshOwned(owner.uid)
      return record
    } finally {
      isLoading.value = false
    }
  }

  async function saveUpdated(
    listingId: string,
    input: ListingFormInput,
    owner: UserProfile,
    onProgress?: (percent: number) => void
  ) {
    isLoading.value = true
    try {
      const record = await updateListing(listingId, input, owner, onProgress)
      await refreshOwned(owner.uid)
      return record
    } finally {
      isLoading.value = false
    }
  }

  async function changeStatus(listingId: string, owner: UserProfile, status: ListingStatus) {
    const record = await setListingStatus(listingId, owner, status)
    ownedListings.value = ownedListings.value.map((item) => (item.id === record.id ? record : item))
    return record
  }

  async function remove(listingId: string, owner: UserProfile) {
    await removeListing(listingId, owner)
    ownedListings.value = ownedListings.value.filter((item) => item.id !== listingId)
  }

  async function review(
    listingId: string,
    admin: UserProfile,
    moderationStatus: 'approved' | 'rejected'
  ) {
    const record = await reviewMarketplaceListing(listingId, admin, moderationStatus)
    allListings.value = allListings.value.map((item) => (item.id === record.id ? record : item))
    return record
  }

  return {
    ownedListings: computed(() => ownedListings.value),
    publicListings: computed(() => publicListings.value),
    allListings: computed(() => allListings.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    refreshOwned,
    refreshPublic,
    refreshAll,
    findById: getListingById,
    saveNew,
    saveUpdated,
    changeStatus,
    remove,
    review,
  }
}
