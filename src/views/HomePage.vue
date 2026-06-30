<template>
  <AppShell
    eyebrow="Explore"
    title="Find spaces that feel worth the move"
    description="Browse trusted homes, shops, offices, flats, and duplexes with clear next steps from search to inspection."
  >
    <section class="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <div class="hero-shell p-6 sm:p-8">
        <div class="relative overflow-hidden rounded-[22px] bg-hero-mesh p-6 sm:p-8">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">RANDSA Discover</p>
          <h2 class="page-heading mt-4 max-w-3xl">Search real spaces, compare quickly, and book inspections with confidence.</h2>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-mist dark:text-slate-300">
            RANDSA brings listing discovery, saved properties, inspection bookings, payments, and account management into one focused rental workspace.
          </p>
          <div
            v-if="isLocalAuthBypassEnabled"
            class="mt-5 rounded-[22px] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
          >
            Local auth bypass is active on this device. You can test register, login, profile, and protected routes without Firebase for now.
          </div>
          <div
            v-else-if="firebaseConfigError"
            class="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            {{ firebaseConfigError }}. The UI is ready, but authentication needs your Firebase env values before it can be tested.
          </div>
          <div
            v-else
            class="mt-5 rounded-[22px] border border-white/70 bg-white/70 px-4 py-4 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
          >
            <span v-if="isAuthenticated">
              Signed in as <strong>{{ welcomeName }}</strong>
              <span v-if="roleLabel">({{ roleLabel }})</span>.
            </span>
            <span v-else>
              Sign in or create an account to unlock bookings, saved properties, and profile management.
            </span>
          </div>
          <div class="mt-6 rounded-[20px] border border-white/70 bg-white/80 p-3 shadow-panel dark:border-white/10 dark:bg-slate-900/70">
            <div class="flex flex-col gap-3 lg:flex-row">
              <input
                type="text"
                placeholder="Search by city, area, or property type"
                class="premium-input"
              >
              <RouterLink
                to="/properties"
                class="rounded-[22px] bg-ink px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Explore listings
              </RouterLink>
            </div>
          </div>
          <div class="mt-5 flex flex-wrap gap-3">
            <RouterLink
              v-if="!isAuthenticated"
              to="/login"
              class="premium-button-primary"
            >
              Sign in
            </RouterLink>
            <RouterLink
              v-if="!isAuthenticated"
              to="/register"
              class="premium-button-secondary"
            >
              Create account
            </RouterLink>
            <RouterLink
              v-if="isAuthenticated"
              to="/profile"
              class="premium-button-primary"
            >
              Open profile
            </RouterLink>
          </div>
          <div class="mt-5 flex flex-wrap gap-3">
            <span v-for="chip in categoryChips" :key="chip" class="section-chip">{{ chip }}</span>
          </div>
          <div class="mt-7 grid gap-3 sm:grid-cols-3">
            <div class="surface-card">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Search-first</p>
              <p class="mt-3 text-sm leading-6 text-mist dark:text-slate-300">Browse by city, area, price range, and property type without losing context.</p>
            </div>
            <div class="surface-card">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Verified paths</p>
              <p class="mt-3 text-sm leading-6 text-mist dark:text-slate-300">Agent verification and moderation keep trust signals close to each listing.</p>
            </div>
            <div class="surface-card">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Action-ready</p>
              <p class="mt-3 text-sm leading-6 text-mist dark:text-slate-300">Save, pay, book, and track reminders without jumping between tools.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4">
        <div class="metric-card">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Quick facts</p>
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="rounded-[24px] bg-slate-50 p-4 dark:bg-slate-950/60"
            >
              <p class="text-2xl font-bold text-ink dark:text-white">{{ stat.value }}</p>
              <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ stat.label }}</p>
            </div>
          </div>
        </div>
        <div class="metric-card">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Platform highlights</p>
          <ul class="mt-4 grid gap-3 text-sm text-mist dark:text-slate-300">
            <li class="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">Fast account access with email or Google sign-in</li>
            <li class="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">Listings, filters, details, and maps built around rental decisions</li>
            <li class="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">Bookings, payments, moderation, and reminders connected end to end</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="mt-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Featured shells</p>
          <h2 class="mt-2 text-2xl font-bold text-ink dark:text-white">Sample property cards</h2>
        </div>
        <RouterLink to="/properties" class="text-sm font-semibold text-brand-700">See all</RouterLink>
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="property in featuredProperties"
          :key="property.title"
          class="glass-panel overflow-hidden"
        >
          <div class="relative h-52 bg-slate-100 dark:bg-slate-900">
            <img :src="heroImage" alt="" class="h-full w-full object-cover opacity-90">
            <div class="absolute left-5 top-5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-brand-700 shadow-sm">
              Curated pick
            </div>
          </div>
          <div class="p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-bold text-ink dark:text-white">{{ property.title }}</h3>
                <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ property.location }}</p>
              </div>
              <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                {{ property.type }}
              </span>
            </div>
            <p class="mt-4 text-xl font-bold text-ink dark:text-white">{{ property.price }}</p>
            <div class="mt-4 flex items-center justify-between text-sm text-mist dark:text-slate-300">
              <span>{{ property.meta }}</span>
              <RouterLink to="/properties/sample-property" class="font-semibold text-brand-700">
                Open
              </RouterLink>
            </div>
          </div>
        </article>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import heroImage from '../assets/hero.png'
import { useAuth } from '../composables/useAuth'
import { firebaseConfigError, isLocalAuthBypassEnabled } from '../lib/firebase'

const categoryChips = ['House rent', 'Shop rent', 'Office space', 'Apartment', 'Flat', 'Duplex']

const stats = [
  { value: '17', label: 'Core screens' },
  { value: '05', label: 'Primary actions' },
  { value: '12+', label: 'Connected flows' },
  { value: '24h', label: 'Reminder window' },
]

const featuredProperties = [
  {
    title: 'Sunlit 2-bedroom flat',
    location: 'Lekki Phase 1, Lagos',
    type: 'Flat',
    price: 'NGN 3,500,000 / year',
    meta: '2 beds | 3 baths',
  },
  {
    title: 'Roadside retail shop',
    location: 'Wuse 2, Abuja',
    type: 'Shop rent',
    price: 'NGN 2,200,000 / year',
    meta: '120 sqm | busy frontage',
  },
  {
    title: 'Modern office suite',
    location: 'Port Harcourt GRA',
    type: 'Office space',
    price: 'NGN 5,800,000 / year',
    meta: '4 rooms | parking',
  },
]

const { isAuthenticated, state } = useAuth()

const welcomeName = computed(() => state.profile?.fullName || state.user?.email || 'your account')
const roleLabel = computed(() => {
  const role = state.profile?.role
  return role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : ''
})
</script>
