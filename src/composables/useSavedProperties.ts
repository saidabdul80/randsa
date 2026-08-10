import { computed, ref } from 'vue'

import {
  listSavedProperties,
  removeSavedProperty,
  saveMarketplaceItem,
  saveProperty,
  type SavedPropertyRecord,
} from '../services/savedProperties'
import type { PropertyRecord } from '../types/property'
import type { MarketplaceDiscoveryItem, MarketplaceSaveSource } from '../types/marketplace'

const savedRecords = ref<SavedPropertyRecord[]>([])
const isLoading = ref(false)
const error = ref('')
const hasLoaded = ref(false)
let refreshSequence = 0
let activeUserId = ''

export function useSavedProperties() {
  async function refresh(userId: string | null | undefined) {
    const requestId = ++refreshSequence
    const nextUserId = userId ?? ''
    if (activeUserId !== nextUserId) {
      activeUserId = nextUserId
      savedRecords.value = []
      hasLoaded.value = false
    }
    if (!userId) {
      savedRecords.value = []
      error.value = ''
      hasLoaded.value = true
      return savedRecords.value
    }

    isLoading.value = true
    error.value = ''
    try {
      const records = await listSavedProperties(userId)
      if (requestId === refreshSequence) {
        savedRecords.value = records
        hasLoaded.value = true
      }
      return records
    } catch (caughtError) {
      if (requestId === refreshSequence) {
        error.value =
          caughtError instanceof Error ? caughtError.message : 'Could not load saved listings.'
      }
      throw caughtError
    } finally {
      if (requestId === refreshSequence) isLoading.value = false
    }
  }

  function propertyIsSaved(
    userId: string | null | undefined,
    propertyId: string,
    source: MarketplaceSaveSource = 'property'
  ) {
    if (!userId) return false
    return savedRecords.value.some(
      (record) =>
        record.userId === userId && record.propertyId === propertyId && record.source === source
    )
  }

  async function toggleSavedProperty(userId: string | null | undefined, property: PropertyRecord) {
    if (!userId) {
      throw new Error('You need to be signed in before saving properties.')
    }

    isLoading.value = true
    error.value = ''

    try {
      if (propertyIsSaved(userId, property.id)) {
        await removeSavedProperty(userId, property.id, 'property')
      } else {
        await saveProperty(userId, property)
      }

      await refresh(userId)
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not update saved properties.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function toggleSavedItem(
    userId: string | null | undefined,
    item: MarketplaceDiscoveryItem
  ) {
    if (!userId) {
      throw new Error('You need to be signed in before saving listings.')
    }

    isLoading.value = true
    error.value = ''
    try {
      if (propertyIsSaved(userId, item.id, item.saveSource)) {
        await removeSavedProperty(userId, item.id, item.saveSource)
      } else {
        await saveMarketplaceItem(userId, item.id, item.saveSource)
      }
      await refresh(userId)
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not update saved listings.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  function getSavedPropertyIds(userId: string | null | undefined) {
    return new Set(
      savedRecords.value
        .filter((record) => record.userId === userId)
        .map((record) => record.propertyId)
    )
  }

  return {
    savedRecords: computed(() => savedRecords.value),
    isLoading: computed(() => isLoading.value),
    hasLoaded: computed(() => hasLoaded.value),
    error: computed(() => error.value),
    refresh,
    propertyIsSaved,
    toggleSavedProperty,
    toggleSavedItem,
    getSavedPropertyIds,
  }
}
