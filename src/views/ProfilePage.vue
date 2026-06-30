<template>
  <AppShell
    eyebrow="Account"
    title="Profile"
    description="Your account, verification status, shortcuts, and maintenance tools in one cleaner dashboard."
  >
    <section class="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div class="hero-shell p-6 sm:p-8">
        <div class="flex items-center gap-4">
          <div class="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-brand-100 to-white text-2xl font-bold text-brand-700 shadow-panel dark:from-brand-500/20 dark:to-slate-900">
            {{ initials }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-ink dark:text-white">{{ displayName }}</h2>
            <p class="mt-1 text-sm text-mist dark:text-slate-300">
              {{ roleLabel }} account
              <span v-if="profile?.isVerifiedAgent">| Verified agent</span>
            </p>
          </div>
        </div>

        <div
          v-if="noticeMessage || errorMessage || state.error"
          class="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
        >
          {{ noticeMessage || errorMessage || state.error }}
        </div>

        <div class="mt-6 grid gap-3">
          <div class="surface-card px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
            <span class="font-semibold">Email:</span> {{ profile?.email ?? user?.email ?? 'Unavailable' }}
          </div>
          <div class="surface-card px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
            <span class="font-semibold">Phone:</span> {{ profile?.phone || 'Not added yet' }}
          </div>
          <div class="surface-card px-4 py-4 text-sm text-slate-700 dark:text-slate-200">
            <span class="font-semibold">Verification status:</span> {{ verificationLabel }}
          </div>
        </div>

        <div class="mt-6 grid gap-3">
          <RouterLink to="/saved-properties" class="action-link-card">
            <span>Saved properties</span>
            <span aria-hidden="true">-></span>
          </RouterLink>
          <RouterLink to="/notifications" class="action-link-card">
            <span>Notifications</span>
            <span aria-hidden="true">-></span>
          </RouterLink>
          <RouterLink
            v-if="profile?.role === 'agent'"
            to="/agent-verification"
            class="action-link-card"
          >
            <span>Agent verification</span>
            <span aria-hidden="true">-></span>
          </RouterLink>
          <RouterLink
            v-if="profile?.role === 'admin'"
            to="/admin"
            class="action-link-card"
          >
            <span>Admin dashboard</span>
            <span aria-hidden="true">-></span>
          </RouterLink>
          <div
            v-if="isLocalAuthBypassEnabled"
            class="rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-4 dark:border-sky-500/30 dark:bg-sky-500/10"
          >
            <p class="text-sm font-semibold text-sky-800 dark:text-sky-200">Bypass role switcher</p>
            <p class="mt-2 text-sm leading-6 text-sky-700 dark:text-sky-100">
              Temporary for local testing only. Switch role here when you need to review tenant, landlord, agent, or admin paths on this device.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="item in switchableRoles"
                :key="item"
                type="button"
                class="rounded-full px-4 py-2 text-sm font-semibold transition"
                :class="profile?.role === item
                  ? 'bg-sky-700 text-white'
                  : 'bg-white text-sky-800 hover:bg-sky-100 dark:bg-slate-900 dark:text-sky-200 dark:hover:bg-slate-800'"
                @click="handleRoleSwitch(item)"
              >
                {{ item }}
              </button>
            </div>
          </div>
          <button
            type="button"
            class="rounded-[18px] bg-ink px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="isSigningOut"
            @click="handleLogout"
          >
            {{ isSigningOut ? 'Signing out...' : 'Logout' }}
          </button>
        </div>
      </div>
      <div class="glass-panel p-6 sm:p-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 class="text-lg font-bold text-ink dark:text-white">Profile quick actions</h3>
            <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">
              The fastest paths for account management, saved listings, moderation access, and maintenance tools.
            </p>
          </div>
          <div class="surface-card p-4">
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Current role</p>
            <p class="mt-2 text-sm font-semibold text-ink dark:text-white">{{ roleLabel }}</p>
          </div>
        </div>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <RouterLink v-for="card in cards" :key="card.title" :to="card.to" class="surface-card block p-4 transition hover:border-brand-200">
            <h4 class="text-sm font-bold text-ink dark:text-white">{{ card.title }}</h4>
            <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">{{ card.copy }}</p>
          </RouterLink>
        </div>

        <div class="mt-6">
          <StoragePathTester :profile="profile" />
        </div>

        <div class="mt-6">
          <LocalDataMigrationCard :profile="profile" />
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import LocalDataMigrationCard from '../components/profile/LocalDataMigrationCard.vue'
import StoragePathTester from '../components/profile/StoragePathTester.vue'
import { rehydrateAuthState, signOutCurrentUser, useAuth } from '../composables/useAuth'
import { switchLocalBypassRole, toDisplayError } from '../services/auth'
import type { UserRole } from '../types/user'
import { formatVerificationStatusLabel } from '../types/verification'

const cards = [
  { title: 'My bookings', copy: 'Check pending and confirmed inspections from the profile area.', to: '/my-bookings' },
  { title: 'Add property', copy: 'Landlords and agents can jump into listing creation from here or the bottom navigation.', to: '/add-property' },
  { title: 'Notifications', copy: 'Review booking confirmations, payment updates, and inspection reminders.', to: '/notifications' },
  { title: 'Admin tools', copy: 'Admins can review properties, users, payments, bookings, and verification requests.', to: '/admin' },
]

const route = useRoute()
const router = useRouter()
const { isLocalAuthBypassEnabled, state } = useAuth()
const isSigningOut = ref(false)
const errorMessage = ref('')
const switchableRoles: UserRole[] = ['tenant', 'landlord', 'agent', 'admin']

const profile = computed(() => state.profile)
const user = computed(() => state.user)
const displayName = computed(() => profile.value?.fullName || user.value?.email || 'RANDSA User')
const roleLabel = computed(() => {
  const role = profile.value?.role ?? 'tenant'
  return role.charAt(0).toUpperCase() + role.slice(1)
})
const verificationLabel = computed(() => {
  const status = profile.value?.verificationStatus ?? 'not_submitted'
  return formatVerificationStatusLabel(status)
})
const noticeMessage = computed(() => {
  if (route.query.notice === 'property-manager-only') {
    return 'Only landlord, agent, and admin accounts can open Add Property. Your current role does not have listing access yet.'
  }

  if (route.query.notice === 'admin-only') {
    return 'Only admin accounts can open that page. Use the Admin dashboard shortcut here after signing in with an admin profile.'
  }

  if (route.query.notice === 'agent-only') {
    return 'Only agent accounts can open the verification form. If you need moderation tools instead, use the Admin dashboard shortcut.'
  }

  return ''
})
const initials = computed(() =>
  displayName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'R',
)

async function handleLogout() {
  errorMessage.value = ''
  isSigningOut.value = true

  try {
    await signOutCurrentUser()
    await router.replace('/login')
  } catch (error) {
    errorMessage.value = toDisplayError(error)
  } finally {
    isSigningOut.value = false
  }
}

async function handleRoleSwitch(role: UserRole) {
  if (!profile.value) {
    errorMessage.value = 'Sign in before switching the local bypass role.'
    return
  }

  errorMessage.value = ''

  try {
    await switchLocalBypassRole(profile.value.uid, role)
    await rehydrateAuthState()
  } catch (error) {
    errorMessage.value = toDisplayError(error)
  }
}
</script>
