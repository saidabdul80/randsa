<template>
  <AppShell
    eyebrow="Search"
    title="Property listings"
    description="Search, filtering, and sorting now sit inside a cleaner catalog experience built for faster browsing."
  >
    <section class="hero-shell p-5 sm:p-6">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex-1">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by title, area, city, or property type"
            class="premium-input"
          >
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
          <PropertySortSelect v-model="filters.sortBy" />
          <button
            type="button"
            class="premium-button-secondary"
            @click="showFilters = !showFilters"
          >
            {{ showFilters ? 'Hide filters' : 'Refine search' }}
          </button>
          <RouterLink
            v-if="canManageProperties"
            to="/add-property"
            class="premium-button-primary"
          >
            Add property
          </RouterLink>
        </div>
      </div>

      <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="chip in activeFilterChips"
            :key="chip"
            class="rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-200"
          >
            {{ chip }}
          </span>
          <span
            v-if="!activeFilterChips.length"
            class="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            Open catalog
          </span>
        </div>
        <div class="surface-card flex items-center justify-between gap-5 p-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Results</p>
            <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ filteredProperties.length }} property{{ filteredProperties.length === 1 ? '' : 'ies' }}</p>
          </div>
          <div class="h-12 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Order</p>
            <p class="mt-1 text-sm text-mist dark:text-slate-300">{{ sortLabelMap[filters.sortBy] }}</p>
          </div>
        </div>
      </div>
    </section>

    <PropertyFilterPanel
      v-if="showFilters"
      class="mt-6"
      v-model="filters"
      :property-types="propertyTypes"
      @reset="resetFilters"
    />

    <section class="mt-6 flex items-center justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Results</p>
        <h2 class="mt-1 text-xl font-bold text-ink dark:text-white">
          {{ filteredProperties.length }} property{{ filteredProperties.length === 1 ? '' : 'ies' }}
        </h2>
      </div>
      <p class="text-sm text-mist dark:text-slate-300">
        Sorted by {{ sortLabelMap[filters.sortBy] }}
      </p>
    </section>

    <section v-if="filteredProperties.length" class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in filteredProperties"
        :key="item.id"
        class="glass-panel overflow-hidden transition hover:-translate-y-1 hover:shadow-[0_26px_55px_-28px_rgba(16,32,51,0.45)]"
      >
        <div class="relative">
          <img
            :src="item.images[0] || fallbackImage"
            alt="Property cover"
            class="h-48 w-full object-cover"
          >
          <div class="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/35 to-transparent" />
          <div class="absolute left-4 top-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-white/[0.88] px-3 py-1 text-xs font-bold text-brand-700 backdrop-blur">
              {{ item.propertyType }}
            </span>
            <span
              v-if="item.isAvailable"
              class="rounded-full bg-emerald-50/95 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur"
            >
              Available
            </span>
          </div>
        </div>
        <div class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-ink dark:text-white">{{ item.title }}</h2>
              <p class="mt-1 text-sm text-mist dark:text-slate-300">
                {{ item.area }}, {{ item.city }}, {{ item.state }}
              </p>
            </div>
            <span
              class="status-pill"
              :class="statusClassMap[item.status]"
            >
              {{ item.status }}
            </span>
          </div>
          <p class="mt-4 text-xl font-bold text-ink dark:text-white">
            {{ formatCurrency(item.rentPrice) }} / {{ item.paymentDuration }}
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-if="ownerProfiles[item.ownerId]?.isVerifiedAgent"
              class="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200"
            >
              Verified agent
            </span>
            <span
              v-if="item.ownerId === state.profile?.uid"
              class="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white"
            >
              Your listing
            </span>
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >{{ item.category }}</span>
          </div>
          <div class="mt-5 flex items-center justify-between text-sm">
            <span class="text-mist dark:text-slate-300">{{ propertyMeta(item) }}</span>
            <RouterLink :to="`/properties/${item.id}`" class="font-semibold text-brand-700">
              View details
            </RouterLink>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="mt-6 glass-panel grid place-items-center p-10 text-center sm:p-14">
      <div class="max-w-md">
        <div class="empty-state-mark">0</div>
        <h2 class="mt-6 text-2xl font-bold text-ink dark:text-white">No matching properties</h2>
        <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
          Try widening the search area, adjusting the price range, or resetting the filters to see more listings.
        </p>
        <button
          type="button"
          class="mt-6 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          @click="resetFilters"
        >
          Reset filters
        </button>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import PropertyFilterPanel from '../components/property/PropertyFilterPanel.vue'
import PropertySortSelect from '../components/property/PropertySortSelect.vue'
import AppShell from '../components/layout/AppShell.vue'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { getUserProfilesByIds } from '../services/auth'
import {
  createDefaultPropertyFilters,
  isHouseLikeProperty,
  isShopProperty,
  type PropertyFilterState,
  type PropertyRecord,
  type PropertyType,
} from '../types/property'
import type { UserProfile } from '../types/user'

const propertyTypes: PropertyType[] = [
  'House rent',
  'Shop rent',
  'Office space',
  'Apartment',
  'Self-contained',
  'Flat',
  'Duplex',
  'Land',
]

const fallbackImage =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22240%22 viewBox=%220 0 400 240%22%3E%3Crect width=%22400%22 height=%22240%22 fill=%22%23dbeeff%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23185ac8%22 font-family=%22Segoe UI%22 font-size=%2220%22%3ERANDSA Property%3C/text%3E%3C/svg%3E'

const statusClassMap = {
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const sortLabelMap = {
  newest: 'newest first',
  'lowest-price': 'lowest price',
  'highest-price': 'highest price',
} as const

const { refresh, properties } = useProperties()
const { canManageProperties, state } = useAuth()

const showFilters = ref(false)
const filters = reactive<PropertyFilterState>(createDefaultPropertyFilters())
const ownerProfiles = ref<Record<string, UserProfile>>({})

void refresh()

const visibleProperties = computed(() =>
  properties.value.filter(
    (property) => property.status === 'approved' || property.ownerId === state.profile?.uid,
  ),
)

watch(
  visibleProperties,
  async (items) => {
    ownerProfiles.value = await getUserProfilesByIds(items.map((property) => property.ownerId))
  },
  { immediate: true },
)

const filteredProperties = computed(() => {
  const query = filters.search.trim().toLowerCase()

  const matched = visibleProperties.value.filter((property) => {
    if (query) {
      const haystack = [
        property.title,
        property.area,
        property.city,
        property.state,
        property.propertyType,
        property.description,
      ]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query)) {
        return false
      }
    }

    if (
      filters.area.trim() &&
      !property.area.toLowerCase().includes(filters.area.trim().toLowerCase())
    ) {
      return false
    }

    if (
      filters.city.trim() &&
      !property.city.toLowerCase().includes(filters.city.trim().toLowerCase())
    ) {
      return false
    }

    if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) {
      return false
    }

    if (filters.minPrice !== null && property.rentPrice < filters.minPrice) {
      return false
    }

    if (filters.maxPrice !== null && property.rentPrice > filters.maxPrice) {
      return false
    }

    if (filters.kind === 'shop' && !isShopProperty(property.propertyType)) {
      return false
    }

    if (filters.kind === 'house' && !isHouseLikeProperty(property.propertyType)) {
      return false
    }

    if (
      filters.bedrooms !== null &&
      (property.bedrooms === null || property.bedrooms < filters.bedrooms)
    ) {
      return false
    }

    if (filters.availability === 'available' && !property.isAvailable) {
      return false
    }

    if (filters.availability === 'unavailable' && property.isAvailable) {
      return false
    }

    return true
  })

  return [...matched].sort((left: PropertyRecord, right: PropertyRecord) => {
    if (filters.sortBy === 'lowest-price') {
      return left.rentPrice - right.rentPrice
    }

    if (filters.sortBy === 'highest-price') {
      return right.rentPrice - left.rentPrice
    }

    return right.createdAt.localeCompare(left.createdAt)
  })
})

const activeFilterChips = computed(() => {
  const chips: string[] = []

  if (filters.area.trim()) chips.push(`Area: ${filters.area.trim()}`)
  if (filters.city.trim()) chips.push(`City: ${filters.city.trim()}`)
  if (filters.propertyType !== 'all') chips.push(filters.propertyType)
  if (filters.kind !== 'all') chips.push(filters.kind === 'house' ? 'House style' : 'Shop rent')
  if (filters.minPrice !== null) chips.push(`Min: ${formatCurrency(filters.minPrice)}`)
  if (filters.maxPrice !== null) chips.push(`Max: ${formatCurrency(filters.maxPrice)}`)
  if (filters.bedrooms !== null) chips.push(`${filters.bedrooms}+ bedrooms`)
  if (filters.availability !== 'all') {
    chips.push(filters.availability === 'available' ? 'Available only' : 'Unavailable only')
  }

  return chips
})

function resetFilters() {
  Object.assign(filters, createDefaultPropertyFilters())
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

function propertyMeta(property: PropertyRecord) {
  if (property.propertyType === 'Shop rent') {
    return property.shopSize || 'Shop details available'
  }

  if (property.bedrooms !== null && property.bathrooms !== null) {
    return `${property.bedrooms} beds | ${property.bathrooms} baths`
  }

  return property.category
}
</script>
