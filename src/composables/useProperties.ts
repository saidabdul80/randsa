import { computed, ref } from 'vue'

import {
  createProperty,
  getPropertyById,
  listProperties,
  reviewPropertyStatus,
  updateProperty,
} from '../services/properties'
import {
  isPropertyManagerRole,
  type PropertyFormInput,
  type PropertyRecord,
} from '../types/property'
import type { UserProfile } from '../types/user'

const properties = ref<PropertyRecord[]>([])
const hasLoaded = ref(false)
const isLoading = ref(false)
const isRefreshing = ref(false)
const error = ref('')
let refreshPromise: Promise<PropertyRecord[]> | null = null

export function useProperties() {
  function refresh() {
    if (refreshPromise) {
      return refreshPromise
    }

    isRefreshing.value = true
    error.value = ''
    refreshPromise = listProperties()
      .then((records) => {
        properties.value = records
        hasLoaded.value = true
        return records
      })
      .catch((caughtError) => {
        error.value =
          caughtError instanceof Error ? caughtError.message : 'Could not load properties.'
        throw caughtError
      })
      .finally(() => {
        isRefreshing.value = false
        refreshPromise = null
      })

    return refreshPromise
  }

  async function findById(propertyId: string) {
    const property = await getPropertyById(propertyId)

    if (property) {
      const existingIndex = properties.value.findIndex((current) => current.id === property.id)

      if (existingIndex === -1) {
        properties.value = [property, ...properties.value]
      } else {
        properties.value = properties.value.map((current) =>
          current.id === property.id ? property : current
        )
      }
    }

    return property
  }

  async function saveNewProperty(input: PropertyFormInput, owner: UserProfile) {
    isLoading.value = true
    error.value = ''

    try {
      const property = await createProperty(input, owner)
      await refresh()
      return property
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not save property.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function saveUpdatedProperty(
    propertyId: string,
    input: PropertyFormInput,
    owner: UserProfile
  ) {
    isLoading.value = true
    error.value = ''

    try {
      const property = await updateProperty(propertyId, input, owner)
      await refresh()
      return property
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not update property.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function reviewListing(
    propertyId: string,
    owner: UserProfile,
    status: 'approved' | 'rejected'
  ) {
    isLoading.value = true
    error.value = ''

    try {
      const property = await reviewPropertyStatus(propertyId, owner, status)
      await refresh()
      return property
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not review property.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  if (!hasLoaded.value && !isRefreshing.value) {
    void refresh().catch(() => undefined)
  }

  return {
    properties: computed(() => properties.value),
    hasLoaded: computed(() => hasLoaded.value),
    isLoading: computed(() => isLoading.value || isRefreshing.value),
    error: computed(() => error.value),
    canCreateProperty: (role: UserProfile['role'] | null | undefined) =>
      isPropertyManagerRole(role),
    refresh,
    findById,
    saveNewProperty,
    saveUpdatedProperty,
    reviewListing,
  }
}
