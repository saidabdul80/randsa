<template>
  <AppShell
    eyebrow="Access"
    title="Sign in to RANDSA"
    description="Sign in with Firebase Authentication. If you were redirected here, you will return to your requested page after login."
    :show-bottom-nav="false"
  >
    <section class="mx-auto w-full max-w-xl">
      <div class="glass-panel p-6 sm:p-8">
        <div
          v-if="isLocalAuthBypassEnabled"
          class="rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
        >
          Local auth bypass is enabled. Create an account here, then sign in with those local test credentials.
        </div>
        <div
          v-else-if="firebaseConfigError"
          class="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {{ firebaseConfigError }}. Add the values from `.env.example` before testing authentication.
        </div>

        <form class="mt-4 grid gap-4" @submit.prevent="handleSubmit">
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Email
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="name@example.com"
              class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
            >
          </label>
          <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Password
            <input
              v-model="form.password"
              type="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900"
            >
          </label>

          <p
            v-if="statusMessage"
            class="rounded-[22px] px-4 py-3 text-sm"
            :class="statusTone === 'error'
              ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'"
          >
            {{ statusMessage }}
          </p>

          <button
            type="submit"
            class="mt-2 w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <div class="mt-5">
          <div class="flex items-center gap-3">
            <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">or</span>
            <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <button
            type="button"
            class="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            :disabled="isSubmitting || isGoogleSubmitting || isLocalAuthBypassEnabled || Boolean(firebaseConfigError)"
            @click="handleGoogleSignIn"
          >
            <span class="text-base">G</span>
            {{ isGoogleSubmitting ? 'Connecting to Google...' : 'Continue with Google' }}
          </button>
          <button
            type="button"
            class="mt-3 w-full rounded-full border border-dashed border-brand-300 bg-brand-50/50 px-6 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200"
            :disabled="isSubmitting || isGoogleSubmitting || isLocalAuthBypassEnabled || Boolean(firebaseConfigError)"
            @click="handleGoogleRedirectSignIn"
          >
            {{ isGoogleSubmitting ? 'Switching to redirect...' : 'Use Google redirect instead' }}
          </button>
          <p class="mt-3 text-xs leading-5 text-mist dark:text-slate-400">
            Use redirect mode if the Google popup closes unexpectedly or your browser blocks popup sign-in.
          </p>
          <p
            v-if="googleHelperMessage"
            class="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            {{ googleHelperMessage }}
          </p>
        </div>

        <p class="mt-4 text-center text-sm text-mist dark:text-slate-300">
          New here?
          <RouterLink to="/register" class="font-semibold text-brand-700">Create an account</RouterLink>
        </p>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import { rehydrateAuthState, useAuth } from '../composables/useAuth'
import { firebaseConfigError, isLocalAuthBypassEnabled } from '../lib/firebase'
import {
  consumeGoogleRedirectReturnTo,
  getPendingGoogleAuthMessage,
  loginUser,
  signInWithGoogle,
  startGoogleRedirectSignIn,
  toDisplayError,
} from '../services/auth'

const route = useRoute()
const router = useRouter()
const { state } = useAuth()

const form = reactive({
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const isGoogleSubmitting = ref(false)
const statusMessage = ref('')
const statusTone = ref<'error' | 'success'>('error')
const isRedirectingAfterGoogle = ref(false)
const googleHelperMessage = ref(getPendingGoogleAuthMessage())

function refreshGoogleHelperMessage() {
  googleHelperMessage.value = getPendingGoogleAuthMessage()
}

watch(
  () => state.user?.uid,
  async (userId) => {
    const redirect = consumeGoogleRedirectReturnTo()

    if (!userId || !redirect || isRedirectingAfterGoogle.value) {
      return
    }

    isRedirectingAfterGoogle.value = true
    statusTone.value = 'success'
    statusMessage.value = 'Google sign-in completed. Redirecting...'
    await router.replace(redirect)
  },
  { immediate: true },
)

async function handleSubmit() {
  statusMessage.value = ''

  if (!form.email.trim() || !form.password) {
    statusTone.value = 'error'
    statusMessage.value = 'Enter your email and password to continue.'
    return
  }

  isSubmitting.value = true

  try {
    await loginUser(form.email, form.password)
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Login successful. Redirecting...'

    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/home'

    await router.replace(redirect)
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleSignIn() {
  statusMessage.value = ''
  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    const profile = await signInWithGoogle({
      returnTo:
        typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
          ? route.query.redirect
          : '/home',
      source: 'login',
    })

    if (!profile) {
      statusTone.value = 'success'
      statusMessage.value =
        'Google popup sign-in could not finish, so RANDSA is switching to redirect mode now...'
      refreshGoogleHelperMessage()
      return
    }

    await rehydrateAuthState()
    refreshGoogleHelperMessage()
    statusTone.value = 'success'
    statusMessage.value = 'Google sign-in successful. Redirecting...'

    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/home'

    await router.replace(redirect)
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
    refreshGoogleHelperMessage()
  } finally {
    isGoogleSubmitting.value = false
  }
}

async function handleGoogleRedirectSignIn() {
  statusTone.value = 'success'
  statusMessage.value = 'Switching to Google redirect sign-in...'
  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    await startGoogleRedirectSignIn({
      returnTo:
        typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
          ? route.query.redirect
          : '/home',
      source: 'login',
    })
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
    refreshGoogleHelperMessage()
    isGoogleSubmitting.value = false
  }
}
</script>
