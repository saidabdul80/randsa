import { computed, ref } from 'vue'

const STORAGE_KEY = 'randsa.local.recently-viewed-properties'
const MAX_RECENT_PROPERTIES = 12
const recentlyViewedIds = ref<string[]>([])
let hasHydrated = false

function hydrate() {
  if (hasHydrated || typeof window === 'undefined') return
  hasHydrated = true

  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    const parsed = value ? (JSON.parse(value) as unknown) : []

    if (Array.isArray(parsed)) {
      recentlyViewedIds.value = parsed
        .filter((item): item is string => typeof item === 'string' && Boolean(item))
        .filter((item, index, items) => items.indexOf(item) === index)
        .slice(0, MAX_RECENT_PROPERTIES)
    }
  } catch {
    recentlyViewedIds.value = []
  }
}

function persist() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewedIds.value))
  } catch {
    // Recently viewed remains available for the current session.
  }
}

export function useRecentlyViewedProperties() {
  hydrate()

  function remember(propertyId: string) {
    recentlyViewedIds.value = [
      propertyId,
      ...recentlyViewedIds.value.filter((id) => id !== propertyId),
    ].slice(0, MAX_RECENT_PROPERTIES)
    persist()
  }

  function clear() {
    recentlyViewedIds.value = []
    persist()
  }

  return {
    recentlyViewedIds: computed(() => recentlyViewedIds.value),
    remember,
    clear,
  }
}
