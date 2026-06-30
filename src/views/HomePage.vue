<template>
  <AppShell
    :show-header="false"
    content-class="min-h-full w-full bg-white pb-28 text-ink dark:bg-slate-950 dark:text-white"
  >
    <section class="relative min-h-[640px] overflow-hidden bg-ink text-white sm:min-h-[700px]">
      <img
        :src="homeHeroImage"
        alt="Modern rental home at dusk"
        class="absolute inset-0 h-full w-full object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/38 to-slate-950/16" />
      <div class="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/54 to-transparent" />

      <div class="relative mx-auto flex min-h-[640px] w-full max-w-7xl flex-col px-5 py-7 sm:min-h-[700px] sm:px-8 lg:px-12">
        <header class="flex items-center justify-between gap-4">
          <RouterLink to="/home" class="text-2xl font-extrabold tracking-normal text-white">
            RANDSA
          </RouterLink>
          <nav class="hidden items-center gap-8 text-sm font-semibold text-white/86 md:flex">
            <RouterLink
              v-for="link in desktopLinks"
              :key="link.to"
              :to="link.to"
              class="transition hover:text-white"
            >
              {{ link.label }}
            </RouterLink>
          </nav>
          <RouterLink
            :to="isAuthenticated ? '/properties' : '/register'"
            class="inline-flex h-12 items-center justify-center rounded-full bg-slate-950/82 px-7 text-sm font-bold text-white shadow-xl shadow-slate-950/20 ring-1 ring-white/12 transition hover:bg-slate-900"
          >
            Try Now
          </RouterLink>
        </header>

        <div class="flex flex-1 flex-col justify-center pb-16 pt-14 sm:pt-20">
          <div class="max-w-3xl">
            <p class="mb-4 inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/82 ring-1 ring-white/18 backdrop-blur">
              Rental marketplace
            </p>
            <h1 class="max-w-3xl font-display text-5xl font-bold leading-[1.06] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Finding Your New Home Is Simple
            </h1>
            <p class="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/86 sm:text-xl">
              High-quality rental listings with search, inspection booking, payments, and reminders in one polished flow.
            </p>
          </div>

          <form
            class="mt-10 grid w-full max-w-6xl gap-2 rounded-[28px] bg-white p-3 shadow-2xl shadow-slate-950/24 sm:grid-cols-[1.1fr_1fr_0.85fr_auto] sm:items-center sm:rounded-full"
            @submit.prevent="submitSearch"
          >
            <label class="flex min-h-14 items-center gap-3 rounded-2xl px-4 text-slate-700 sm:rounded-full">
              <ion-icon :icon="locationOutline" class="text-xl text-slate-400" />
              <input
                v-model="search.city"
                type="text"
                class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-500 sm:text-base"
                placeholder="City or street"
              >
            </label>
            <label class="flex min-h-14 items-center gap-3 border-slate-200 px-4 text-slate-700 sm:border-l">
              <ion-icon :icon="homeOutline" class="text-xl text-slate-400" />
              <select
                v-model="search.type"
                class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none sm:text-base"
              >
                <option value="">Type of rent</option>
                <option v-for="type in propertyTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </label>
            <label class="flex min-h-14 items-center gap-3 border-slate-200 px-4 text-slate-700 sm:border-l">
              <ion-icon :icon="cashOutline" class="text-xl text-slate-400" />
              <select
                v-model="search.price"
                class="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none sm:text-base"
              >
                <option value="">Price</option>
                <option value="budget">Budget</option>
                <option value="mid">Mid range</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <button
              type="submit"
              class="inline-flex min-h-14 items-center justify-center rounded-full bg-ink px-8 text-sm font-bold text-white transition hover:bg-slate-800 sm:min-w-32"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </section>

    <section class="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">RANDSA picks</p>
          <h2 class="mt-2 text-3xl font-extrabold tracking-normal text-ink dark:text-white sm:text-4xl">
            Most Viewed
          </h2>
        </div>
        <RouterLink to="/properties" class="hidden text-sm font-bold text-brand-700 sm:inline-flex">
          See all listings
        </RouterLink>
      </div>

      <div class="mt-8 grid gap-6 md:grid-cols-3">
        <article
          v-for="property in featuredProperties"
          :key="property.title"
          class="overflow-hidden rounded-[12px] border border-slate-100 bg-white shadow-[0_18px_45px_-34px_rgba(16,32,51,0.55)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_-34px_rgba(16,32,51,0.65)] dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="aspect-[1.04] overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              :src="homeHeroImage"
              :alt="property.title"
              class="h-full w-full object-cover transition duration-500 hover:scale-105"
            >
          </div>
          <div class="p-5">
            <h3 class="text-xl font-extrabold tracking-normal text-ink dark:text-white">{{ property.title }}</h3>
            <p class="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">{{ property.location }}</p>
            <div class="mt-4 flex items-center gap-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span class="inline-flex items-center gap-1.5">
                <ion-icon :icon="bedOutline" />
                {{ property.beds }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <ion-icon :icon="carOutline" />
                {{ property.parking }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <ion-icon :icon="resizeOutline" />
                {{ property.baths }}
              </span>
            </div>
            <div class="mt-5 flex items-end justify-between gap-4">
              <p class="text-xl font-extrabold text-ink dark:text-white">
                {{ property.price }}
                <span class="text-sm font-medium text-slate-500 dark:text-slate-300">/ year</span>
              </p>
              <RouterLink
                to="/properties"
                class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink transition hover:bg-ink hover:text-white dark:bg-slate-800 dark:text-white"
                :aria-label="`View ${property.title}`"
              >
                <ion-icon :icon="arrowForwardOutline" />
              </RouterLink>
            </div>
          </div>
        </article>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import {
  arrowForwardOutline,
  bedOutline,
  carOutline,
  cashOutline,
  homeOutline,
  locationOutline,
  resizeOutline,
} from 'ionicons/icons'

import AppShell from '../components/layout/AppShell.vue'
import homeHeroImage from '../assets/randsa-hero-home.png'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isAuthenticated } = useAuth()

const desktopLinks = [
  { label: 'Home', to: '/home' },
  { label: 'Listings', to: '/properties' },
  { label: 'Bookings', to: '/my-bookings' },
  { label: 'Alerts', to: '/notifications' },
  { label: 'Profile', to: '/profile' },
]

const propertyTypes = ['House rent', 'Shop rent', 'Office space', 'Apartment', 'Flat', 'Duplex']

const search = reactive({
  city: '',
  type: '',
  price: '',
})

const featuredProperties = [
  {
    title: 'Ocean Breeze Villa',
    location: 'Lekki Phase 1, Lagos',
    beds: 4,
    parking: 2,
    baths: 4,
    price: 'NGN 4.5M',
  },
  {
    title: 'Jakson House',
    location: 'Wuse 2, Abuja',
    beds: 3,
    parking: 2,
    baths: 3,
    price: 'NGN 3.2M',
  },
  {
    title: 'Lakeside Cottage',
    location: 'GRA, Port Harcourt',
    beds: 5,
    parking: 2,
    baths: 5,
    price: 'NGN 5.7M',
  },
]

function submitSearch() {
  const query: Record<string, string> = {}

  if (search.city.trim()) {
    query.search = search.city.trim()
  }

  if (search.type) {
    query.type = search.type
  }

  if (search.price) {
    query.price = search.price
  }

  router.push({ path: '/properties', query })
}
</script>
