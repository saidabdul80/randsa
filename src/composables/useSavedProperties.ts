import { computed, ref } from 'vue'

import {
  isPropertySaved,
  listSavedProperties,
  removeSavedProperty,
  saveProperty,
  type SavedPropertyRecord,
} from '../services/savedProperties'
import type { PropertyRecord } from '../types/property'

const savedRecords = ref<SavedPropertyRecord[]>([])
const isLoading = ref(false)
const error = ref('')

export function useSavedProperties() {
  function refresh(userId: string | null | undefined) {
    savedRecords.value = userId ? listSavedProperties(userId) : []
    return savedRecords.value
  }

  function propertyIsSaved(userId: string | null | undefined, propertyId: string) {
    if (!userId) {
      return false
    }

    return isPropertySaved(userId, propertyId)
  }

  async function toggleSavedProperty(
    userId: string | null | undefined,
    property: PropertyRecord,
  ) {
    if (!userId) {
      throw new Error('You need to be signed in before saving properties.')
    }

    isLoading.value = true
    error.value = ''

    try {
      if (propertyIsSaved(userId, property.id)) {
        removeSavedProperty(userId, property.id)
      } else {
        saveProperty(userId, property)
      }

      refresh(userId)
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not update saved properties.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  function getSavedPropertyIds(userId: string | null | undefined) {
    return new Set(refresh(userId).map((record) => record.propertyId))
  }

  return {
    savedRecords: computed(() => savedRecords.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    refresh,
    propertyIsSaved,
    toggleSavedProperty,
    getSavedPropertyIds,
  }
}
