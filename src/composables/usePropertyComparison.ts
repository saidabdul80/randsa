import { computed, ref } from 'vue'

const STORAGE_KEY = 'randsa.local.property-comparison'
const MAX_COMPARISON_PROPERTIES = 3

const selectedPropertyIds = ref<string[]>([])
let hasHydrated = false

export type ComparisonUpdateResult = 'added' | 'removed' | 'limit'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function hydrate() {
  if (hasHydrated) return

  hasHydrated = true

  if (!canUseStorage()) return

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY)
    const parsedValue = storedValue ? (JSON.parse(storedValue) as unknown) : []

    if (Array.isArray(parsedValue)) {
      selectedPropertyIds.value = parsedValue
        .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, MAX_COMPARISON_PROPERTIES)
    }
  } catch {
    selectedPropertyIds.value = []
  }
}

function persist() {
  if (!canUseStorage()) return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPropertyIds.value))
  } catch {
    // Comparison remains available for the current session when storage is unavailable.
  }
}

export function usePropertyComparison() {
  hydrate()

  function includes(propertyId: string) {
    return selectedPropertyIds.value.includes(propertyId)
  }

  function toggle(propertyId: string): ComparisonUpdateResult {
    if (includes(propertyId)) {
      selectedPropertyIds.value = selectedPropertyIds.value.filter((id) => id !== propertyId)
      persist()
      return 'removed'
    }

    if (selectedPropertyIds.value.length >= MAX_COMPARISON_PROPERTIES) {
      return 'limit'
    }

    selectedPropertyIds.value = [...selectedPropertyIds.value, propertyId]
    persist()
    return 'added'
  }

  function remove(propertyId: string) {
    if (!includes(propertyId)) return

    selectedPropertyIds.value = selectedPropertyIds.value.filter((id) => id !== propertyId)
    persist()
  }

  function clear() {
    selectedPropertyIds.value = []
    persist()
  }

  function prune(validPropertyIds: Iterable<string>) {
    const validIds = new Set(validPropertyIds)
    const nextIds = selectedPropertyIds.value.filter((id) => validIds.has(id))

    if (nextIds.length === selectedPropertyIds.value.length) return

    selectedPropertyIds.value = nextIds
    persist()
  }

  return {
    selectedPropertyIds: computed(() => selectedPropertyIds.value),
    comparisonCount: computed(() => selectedPropertyIds.value.length),
    comparisonIsFull: computed(() => selectedPropertyIds.value.length >= MAX_COMPARISON_PROPERTIES),
    includes,
    toggle,
    remove,
    clear,
    prune,
  }
}
