<template>
  <AppShell
    eyebrow="Join"
    :title="pageTitle"
    :description="pageDescription"
    :show-bottom-nav="false"
  >
    <section class="mx-auto grid w-full max-w-4xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div class="glass-panel p-6 sm:p-8">
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
          {{ isAuthenticated ? 'Account setup' : 'User roles' }}
        </p>
        <h2 class="mt-3 text-2xl font-bold text-ink dark:text-white">
          {{ isAuthenticated ? 'Finish your RANDSA profile.' : 'Choose the path that fits you.' }}
        </h2>
        <p class="mt-3 text-sm leading-6 text-mist dark:text-slate-300">
          {{ heroCopy }}
        </p>
        <div class="mt-6 grid gap-3">
          <button
            v-for="role in roles"
            :key="role.title"
            type="button"
            class="rounded-[24px] border p-4 text-left transition"
            :class="[
              form.role === role.value
                ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-panel dark:border-brand-400 dark:bg-brand-500/10 dark:text-white'
                : 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70',
              isAuthenticated ? 'cursor-default opacity-80' : '',
            ]"
            :disabled="isAuthenticated"
            @click="!isAuthenticated && (form.role = role.value)"
          >
            <h3 class="text-sm font-bold text-ink dark:text-white">{{ role.title }}</h3>
            <p class="mt-1 text-sm leading-6 text-mist dark:text-slate-300">{{ role.copy }}</p>
          </button>
        </div>
      </div>

      <div class="glass-panel p-6 sm:p-8">
        <div
          v-if="isLocalAuthBypassEnabled"
          class="rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
        >
          Local auth bypass is enabled. Accounts created here stay in this browser only.
        </div>
        <div
          v-else-if="firebaseConfigError"
          class="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {{ firebaseConfigError }}. Add the values from `.env.example` before testing this account flow.
        </div>

        <div
          v-if="isAuthenticated"
          class="mt-4 rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100"
        >
          You are already signed in, so this page now works as a profile-completion step instead of creating a second account.
        </div>

        <form class="mt-4" @submit.prevent="isAuthenticated ? handleProfileCompletion() : handleSubmit()">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Full name
              <input
                v-model="form.fullName"
                autocomplete="name"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
            </label>
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Phone
              <input
                v-model="form.phone"
                autocomplete="tel"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
            </label>
            <label class="text-sm font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
              Email
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                :disabled="isAuthenticated"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
            </label>
            <label v-if="!isAuthenticated" class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password
              <input
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
            </label>
            <label v-if="!isAuthenticated" class="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Confirm password
              <input
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
            </label>
            <div
              v-if="isAuthenticated"
              class="rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:bg-slate-950/60 dark:text-slate-200 sm:col-span-2"
            >
              <span class="font-semibold">Current role:</span> {{ currentRoleLabel }}
            </div>
          </div>

          <p
            v-if="statusMessage"
            class="mt-5 rounded-[22px] px-4 py-3 text-sm"
            :class="statusTone === 'error'
              ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'"
          >
            {{ statusMessage }}
          </p>

          <button
            type="submit"
            class="mt-6 w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSubmitting || isProfileSubmitting"
          >
            {{
              isAuthenticated
                ? isProfileSubmitting
                  ? 'Saving profile...'
                  : 'Save profile'
                : isSubmitting
                  ? 'Creating account...'
                  : 'Create account'
            }}
          </button>
        </form>

        <div v-if="!isAuthenticated" class="mt-5">
          <div class="flex items-center gap-3">
            <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">or</span>
            <div class="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          <button
            type="button"
            class="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            :disabled="isSubmitting || isGoogleSubmitting || isLocalAuthBypassEnabled || Boolean(firebaseConfigError)"
            @click="handleGoogleSignUp"
          >
            <span class="text-base">G</span>
            {{ isGoogleSubmitting ? 'Connecting to Google...' : `Continue with Google as ${selectedRoleLabel}` }}
          </button>
          <button
            type="button"
            class="mt-3 w-full rounded-full border border-dashed border-brand-300 bg-brand-50/50 px-6 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200"
            :disabled="isSubmitting || isGoogleSubmitting || isLocalAuthBypassEnabled || Boolean(firebaseConfigError)"
            @click="handleGoogleRedirectSignUp"
          >
            {{ isGoogleSubmitting ? 'Switching to redirect...' : `Use Google redirect as ${selectedRoleLabel}` }}
          </button>
          <p class="mt-3 text-xs leading-5 text-mist dark:text-slate-400">
            First-time Google sign-up will use your selected role above and create the Firestore profile automatically. Use redirect mode if the popup closes unexpectedly.
          </p>
          <p
            v-if="googleHelperMessage"
            class="mt-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            {{ googleHelperMessage }}
          </p>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import { rehydrateAuthState, useAuth } from '../composables/useAuth'
import { firebaseConfigError, isLocalAuthBypassEnabled } from '../lib/firebase'
import {
  consumeGoogleRedirectReturnTo,
  getPendingGoogleAuthMessage,
  registerUser,
  signInWithGoogle,
  startGoogleRedirectSignIn,
  toDisplayError,
  updateUserProfileDetails,
} from '../services/auth'

const router = useRouter()

const roles = [
  {
    value: 'tenant',
    title: 'I want to rent',
    copy: 'For tenants searching for available homes, shops, offices, and apartments.',
  },
  {
    value: 'landlord',
    title: 'I am a landlord',
    copy: 'For owners who want to upload, manage, and track property listings.',
  },
  {
    value: 'agent',
    title: 'I am an agent',
    copy: 'For agents who need verification and listing tools for authorized properties.',
  },
] as const

const { isAuthenticated, state } = useAuth()
const form = reactive({
  fullName: '',
  phone: '',
  email: '',
  password: '',
  role: 'tenant' as (typeof roles)[number]['value'],
})

const confirmPassword = ref('')
const isSubmitting = ref(false)
const isGoogleSubmitting = ref(false)
const isProfileSubmitting = ref(false)
const statusMessage = ref('')
const statusTone = ref<'error' | 'success'>('error')
const isRedirectingAfterGoogle = ref(false)
const googleHelperMessage = ref(getPendingGoogleAuthMessage())
const profile = computed(() => state.profile)
const selectedRoleLabel = computed(() => roles.find((role) => role.value === form.role)?.title ?? 'I want to rent')
const currentRoleLabel = computed(() => {
  const role = profile.value?.role ?? form.role

  if (role === 'admin') {
    return 'Admin'
  }

  return roles.find((item) => item.value === role)?.title ?? 'I want to rent'
})
const pageTitle = computed(() =>
  isAuthenticated.value ? 'Complete your RANDSA profile' : 'Create your RANDSA profile',
)
const pageDescription = computed(() =>
  isAuthenticated.value
    ? 'You are already signed in. Update your account details here instead of creating a second profile.'
    : 'Create an account, choose your role, and save the profile in Firestore during registration.',
)
const heroCopy = computed(() =>
  isAuthenticated.value
    ? 'We keep this route useful for signed-in users by turning it into a profile-completion step. Your existing account stays active, and you can finish missing details here.'
    : 'Choose the role that best matches how you want to use RANDSA first. We will save it with your profile during account creation.',
)

function refreshGoogleHelperMessage() {
  googleHelperMessage.value = getPendingGoogleAuthMessage()
}

watch(
  () => profile.value,
  (value) => {
    if (!value) {
      return
    }

    form.fullName = value.fullName || state.user?.displayName || ''
    form.phone = value.phone || ''
    form.email = value.email || state.user?.email || ''
    form.role = value.role === 'admin' ? 'tenant' : value.role
  },
  { immediate: true },
)

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

  if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim() || !form.password) {
    statusTone.value = 'error'
    statusMessage.value = 'Fill in your full name, phone, email, and password.'
    return
  }

  if (form.password.length < 6) {
    statusTone.value = 'error'
    statusMessage.value = 'Password must be at least 6 characters long.'
    return
  }

  if (form.password !== confirmPassword.value) {
    statusTone.value = 'error'
    statusMessage.value = 'Password confirmation does not match.'
    return
  }

  isSubmitting.value = true

  try {
    await registerUser(form)
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Account created successfully. Redirecting...'
    await router.replace('/home')
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
  } finally {
    isSubmitting.value = false
  }
}

async function handleGoogleSignUp() {
  statusMessage.value = ''
  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    const profile = await signInWithGoogle({
      role: form.role,
      phone: form.phone,
      returnTo: '/home',
      source: 'register',
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
    await router.replace('/home')
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
    refreshGoogleHelperMessage()
  } finally {
    isGoogleSubmitting.value = false
  }
}

async function handleGoogleRedirectSignUp() {
  statusTone.value = 'success'
  statusMessage.value = 'Switching to Google redirect sign-in...'
  isGoogleSubmitting.value = true
  refreshGoogleHelperMessage()

  try {
    await startGoogleRedirectSignIn({
      role: form.role,
      phone: form.phone,
      returnTo: '/home',
      source: 'register',
    })
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
    refreshGoogleHelperMessage()
    isGoogleSubmitting.value = false
  }
}

async function handleProfileCompletion() {
  statusMessage.value = ''

  if (!profile.value) {
    statusTone.value = 'error'
    statusMessage.value = 'Your signed-in profile is still loading. Please wait a moment and try again.'
    return
  }

  isProfileSubmitting.value = true

  try {
    await updateUserProfileDetails(profile.value.uid, {
      fullName: form.fullName,
      phone: form.phone,
    })
    await rehydrateAuthState()
    statusTone.value = 'success'
    statusMessage.value = 'Profile updated successfully. Redirecting to your profile...'
    await router.replace('/profile')
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = toDisplayError(error)
  } finally {
    isProfileSubmitting.value = false
  }
}
</script>
