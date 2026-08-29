import { computed, readonly, ref } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'randsa-theme'

// Module-level state so every component shares one theme rather than its own copy.
const themePreference = ref<ThemePreference>('system')
const systemPrefersDark = ref(false)

let systemThemeQuery: MediaQueryList | null = null
let initialized = false

export const resolvedTheme = computed<'light' | 'dark'>(() =>
  themePreference.value === 'system'
    ? systemPrefersDark.value
      ? 'dark'
      : 'light'
    : themePreference.value
)

/**
 * Tailwind is configured with darkMode: 'class', so every `dark:` variant in the app
 * keys off this single class on <html>.
 */
function applyResolvedTheme() {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.classList.toggle('dark', resolvedTheme.value === 'dark')
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // Following the device preference remains the default when storage is unavailable.
  }

  return 'system'
}

export function setThemePreference(preference: ThemePreference) {
  themePreference.value = preference
  applyResolvedTheme()

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // The chosen theme still applies for this session when storage is unavailable.
  }
}

export function initializeTheme() {
  if (initialized || typeof window === 'undefined') {
    return
  }

  initialized = true
  themePreference.value = readStoredPreference()

  systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = systemThemeQuery.matches
  systemThemeQuery.addEventListener('change', (event) => {
    systemPrefersDark.value = event.matches
    applyResolvedTheme()
  })

  applyResolvedTheme()
}

export function useTheme() {
  return {
    themePreference: readonly(themePreference),
    resolvedTheme,
    setThemePreference,
  }
}
