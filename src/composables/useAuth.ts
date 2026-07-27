import { onAuthStateChanged } from 'firebase/auth'
import { computed, reactive, readonly } from 'vue'

import { auth, authMode, isFirebaseConfigured, isLocalAuthBypassEnabled } from '../lib/firebase'
import {
  completePendingGoogleRedirectSignIn,
  getLocalSessionUser,
  getPendingGoogleAuthMessage,
  getUserProfile,
  hasPendingGoogleAuthFlow,
  logoutUser,
  toDisplayError,
} from '../services/auth'
import { isPropertyManagerRole } from '../types/property'
import type { SessionUser, UserProfile } from '../types/user'

interface AuthState {
  user: SessionUser | null
  profile: UserProfile | null
  isLoading: boolean
  isReady: boolean
  error: string
}

const state = reactive<AuthState>({
  user: null,
  profile: null,
  isLoading: true,
  isReady: false,
  error: '',
})

let listenerStarted = false
let redirectResultHandled = false
let resolveReady: (() => void) | null = null
let readyFallbackTimer: number | null = null

const readyPromise = new Promise<void>((resolve) => {
  resolveReady = resolve
})

function markReady() {
  if (readyFallbackTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(readyFallbackTimer)
    readyFallbackTimer = null
  }

  if (!state.isReady) {
    state.isReady = true
    resolveReady?.()
    resolveReady = null
  }
}

function startReadyFallbackTimer() {
  if (typeof window === 'undefined' || readyFallbackTimer !== null || state.isReady) {
    return
  }

  readyFallbackTimer = window.setTimeout(
    () => {
      if (state.isReady) {
        return
      }

      state.isLoading = false

      if (!state.error) {
        state.error =
          getPendingGoogleAuthMessage() ||
          'Authentication is taking longer than expected. The app is continuing with a safe fallback state.'
      }

      markReady()
    },
    hasPendingGoogleAuthFlow() ? 12000 : 4000
  )
}

async function syncAuthState() {
  state.isLoading = true
  state.error = ''

  if (authMode === 'local') {
    const localUser = getLocalSessionUser()
    state.user = localUser

    if (localUser) {
      try {
        state.profile = await getUserProfile(localUser.uid)
      } catch (error) {
        state.profile = null
        state.error = toDisplayError(error)
      }
    } else {
      state.profile = null
    }

    state.isLoading = false
    markReady()
    return
  }

  if (!isFirebaseConfigured || !auth) {
    state.user = null
    state.profile = null
    state.isLoading = false
    markReady()
    return
  }

  const currentUser = auth.currentUser
  state.user = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
      }
    : null

  if (currentUser) {
    try {
      state.profile = await getUserProfile(currentUser.uid)
    } catch (error) {
      state.profile = null
      state.error = toDisplayError(error)
    }
  } else {
    state.profile = null
  }

  state.isLoading = false
  markReady()
}

export function initializeAuthState() {
  if (listenerStarted) {
    return
  }

  listenerStarted = true
  startReadyFallbackTimer()

  if (authMode === 'local') {
    void syncAuthState()
    return
  }

  if (!isFirebaseConfigured || !auth) {
    void syncAuthState()
    return
  }

  void (async () => {
    if (!redirectResultHandled) {
      redirectResultHandled = true

      try {
        await completePendingGoogleRedirectSignIn()
      } catch (error) {
        state.error = toDisplayError(error)
      }
    }

    onAuthStateChanged(
      auth,
      async (user) => {
        state.isLoading = true
        state.error = ''
        state.user = user
          ? {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
            }
          : null

        if (user) {
          try {
            state.profile = await getUserProfile(user.uid)
          } catch (error) {
            state.profile = null
            state.error = toDisplayError(error)
          }
        } else {
          state.profile = null
        }

        state.isLoading = false
        markReady()
      },
      (error) => {
        state.user = null
        state.profile = null
        state.error = toDisplayError(error)
        state.isLoading = false
        markReady()
      }
    )
  })()
}

export async function ensureAuthReady() {
  initializeAuthState()
  await readyPromise
}

export async function refreshUserProfile() {
  if (!state.user) {
    state.profile = null
    return null
  }

  state.profile = await getUserProfile(state.user.uid)
  return state.profile
}

export async function signOutCurrentUser() {
  await logoutUser()
  await syncAuthState()
}

export async function rehydrateAuthState() {
  await syncAuthState()
}

export function useAuth() {
  const role = computed(() => state.profile?.role ?? null)

  return {
    state: readonly(state),
    isAuthenticated: computed(() => Boolean(state.user)),
    role,
    canManageProperties: computed(() => isPropertyManagerRole(role.value)),
    isLocalAuthBypassEnabled: computed(() => isLocalAuthBypassEnabled),
  }
}
