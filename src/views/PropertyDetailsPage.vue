<template>
  <AppShell
    eyebrow="Details"
    title="Property details"
    description="A richer listing surface with gallery, actions, pricing, map preview, and contact context in one place."
  >
    <section v-if="property" class="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <div class="grid gap-4">
        <div class="hero-shell overflow-hidden">
          <img
            :src="activeImage"
            alt="Selected property image"
            class="h-72 w-full object-cover sm:h-[26rem]"
          >
          <div
            v-if="property.images.length > 1"
            class="grid grid-cols-4 gap-3 p-4"
          >
            <button
              v-for="(image, index) in property.images"
              :key="`${property.id}-image-${index}`"
              type="button"
              class="overflow-hidden rounded-[18px] border transition"
              :class="activeImage === image
                ? 'border-brand-500'
                : 'border-slate-200 dark:border-slate-800'"
              @click="activeImage = image"
            >
              <img :src="image" alt="Property gallery thumbnail" class="h-20 w-full object-cover">
            </button>
          </div>
        </div>

        <div class="glass-panel p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                {{ property.propertyType }}
              </p>
              <p
                v-if="ownerProfile?.isVerifiedAgent"
                class="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-200"
              >
                Verified agent
              </p>
              <h2 class="mt-2 text-2xl font-bold text-ink dark:text-white">{{ property.title }}</h2>
              <p class="mt-2 text-sm text-mist dark:text-slate-300">
                {{ property.address }}, {{ property.area }}, {{ property.city }}, {{ property.state }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-ink dark:text-white">
                {{ formatCurrency(property.rentPrice) }}
              </p>
              <p class="mt-1 text-sm text-mist dark:text-slate-300">
                per {{ property.paymentDuration }}
              </p>
            </div>
          </div>
          <div class="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <p class="text-sm leading-7 text-mist dark:text-slate-300">
            {{ property.description }}
            </p>
            <div class="surface-card p-4">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Listing pulse</p>
              <p class="mt-2 text-sm text-mist dark:text-slate-300">
                {{ property.isAvailable ? 'Available for enquiries and inspection booking.' : 'Currently unavailable while the listing remains visible for reference.' }}
              </p>
            </div>
          </div>
        </div>

        <div class="glass-panel p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="text-lg font-bold text-ink dark:text-white">Map preview</h3>
              <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">
                Use the pinned location to understand the area before calling, paying, or booking an inspection.
              </p>
            </div>
          </div>
          <div class="mt-4">
            <PropertyMapPreview
              :latitude="property.latitude"
              :longitude="property.longitude"
              :title="property.title"
              :price-label="`${formatCurrency(property.rentPrice)} / ${property.paymentDuration}`"
            />
          </div>
        </div>

        <div class="glass-panel p-6">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-lg font-bold text-ink dark:text-white">Features</h3>
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="statusClassMap[property.status]"
            >
              {{ property.status }}
            </span>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="feature in featureBadges"
              :key="feature"
              class="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {{ feature }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid gap-4 lg:sticky lg:top-6 lg:self-start">
        <div class="hero-shell p-6">
          <h3 class="text-lg font-bold text-ink dark:text-white">Quick actions</h3>
          <div class="mt-4 grid gap-3">
            <button
              type="button"
              class="rounded-full px-5 py-3 text-sm font-semibold transition"
              :class="isSaved
                ? 'bg-ink text-white hover:bg-slate-800'
                : 'bg-brand-600 text-white hover:bg-brand-700'"
              @click="handleToggleSaved"
            >
              {{ isSaved ? 'Remove from saved' : 'Save property' }}
            </button>
            <a
              v-if="contactLinks.call"
              :href="contactLinks.call"
              class="premium-button-secondary text-center"
            >
              Call agent or landlord
            </a>
            <a
              v-if="contactLinks.whatsapp"
              :href="contactLinks.whatsapp"
              target="_blank"
              rel="noreferrer"
              class="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              Chat on WhatsApp
            </a>
            <RouterLink
              v-if="canEdit"
              :to="`/edit-property/${property.id}`"
              class="premium-button-secondary text-center"
            >
              Edit property
            </RouterLink>
            <RouterLink
              :to="`/booking/${property.id}`"
              class="premium-button-primary text-center"
            >
              Book inspection
            </RouterLink>
            <RouterLink
              :to="`/payment/${property.id}?type=inspection_fee`"
              class="rounded-full border border-brand-200 bg-brand-50 px-5 py-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200"
            >
              Pay inspection fee
            </RouterLink>
          </div>
          <p
            v-if="actionMessage"
            class="mt-4 rounded-[20px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
          >
            {{ actionMessage }}
          </p>
        </div>

        <div class="metric-card">
          <h3 class="text-lg font-bold text-ink dark:text-white">Listing overview</h3>
          <div class="mt-4 grid gap-3 text-sm text-mist dark:text-slate-300">
            <div>Owner role: <span class="font-semibold text-ink dark:text-white">{{ property.ownerRole }}</span></div>
            <div v-if="ownerProfile?.isVerifiedAgent">Verification: <span class="font-semibold text-sky-700 dark:text-sky-200">Verified agent</span></div>
            <div>Contact phone: <span class="font-semibold text-ink dark:text-white">{{ property.ownerPhone }}</span></div>
            <div>Availability: <span class="font-semibold text-ink dark:text-white">{{ property.isAvailable ? 'Available' : 'Unavailable' }}</span></div>
          </div>
        </div>

        <div class="metric-card">
          <h3 class="text-lg font-bold text-ink dark:text-white">Fees and terms</h3>
          <div class="mt-4 grid gap-3 text-sm text-mist dark:text-slate-300">
            <div>Caution fee: <span class="font-semibold text-ink dark:text-white">{{ formatCurrency(property.cautionFee) }}</span></div>
            <div>Agency fee: <span class="font-semibold text-ink dark:text-white">{{ formatCurrency(property.agencyFee) }}</span></div>
            <div>Inspection fee: <span class="font-semibold text-ink dark:text-white">{{ formatCurrency(property.inspectionFee) }}</span></div>
          </div>
          <div class="mt-5 grid gap-3">
            <RouterLink
              :to="`/payment/${property.id}?type=service_fee`"
              class="premium-button-secondary text-center"
            >
              Pay service fee
            </RouterLink>
            <RouterLink
              :to="`/payment/${property.id}?type=full_rent_payment`"
              class="premium-button-primary text-center"
            >
              Pay full rent
            </RouterLink>
          </div>
        </div>

        <div class="metric-card">
          <h3 class="text-lg font-bold text-ink dark:text-white">Before you book</h3>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Review the photos, fees, location, and contact details. If the listing fits, pay the inspection fee and schedule a visit.
          </p>
        </div>
      </div>
    </section>

    <section v-else class="glass-panel p-8 text-center">
      <h2 class="text-2xl font-bold text-ink dark:text-white">Property not found</h2>
      <p class="mx-auto mt-3 max-w-xl text-sm leading-7 text-mist dark:text-slate-300">
        This property is not available in the current local store, or it has not been created yet.
      </p>
      <RouterLink
        to="/properties"
        class="mt-6 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Back to listings
      </RouterLink>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import PropertyMapPreview from '../components/map/PropertyMapPreview.vue'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { useSavedProperties } from '../composables/useSavedProperties'
import { getUserProfile } from '../services/auth'
import { buildPropertyContactLinks, type PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'

const route = useRoute()
const propertyId = route.params.propertyId as string
const { findById } = useProperties()
const { state } = useAuth()
const { propertyIsSaved, refresh: refreshSaved, toggleSavedProperty } = useSavedProperties()

const property = ref<PropertyRecord | null>(null)
const ownerProfile = ref<UserProfile | null>(null)
const activeImage = ref('')
const actionMessage = ref('')

void findById(propertyId).then((result) => {
  property.value = result
})

watch(
  property,
  (value) => {
    if (value?.images.length && !activeImage.value) {
      activeImage.value = value.images[0]
    }

    if (value?.ownerId) {
      void getUserProfile(value.ownerId)
        .then((profile) => {
          ownerProfile.value = profile
        })
        .catch(() => {
          ownerProfile.value = null
        })
    } else {
      ownerProfile.value = null
    }
  },
  { immediate: true },
)

watch(
  () => state.profile?.uid,
  (userId) => {
    refreshSaved(userId)
  },
  { immediate: true },
)

const canEdit = computed(
  () =>
    Boolean(property.value) &&
    Boolean(state.profile) &&
    (property.value?.ownerId === state.profile?.uid || state.profile?.role === 'admin'),
)

const isSaved = computed(() =>
  property.value ? propertyIsSaved(state.profile?.uid, property.value.id) : false,
)

const contactLinks = computed(() =>
  buildPropertyContactLinks(property.value?.ownerPhone ?? ''),
)

const statusClassMap = {
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
  rejected: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
} as const

const featureBadges = computed(() => {
  if (!property.value) {
    return []
  }

  const features = [...property.value.amenities]

  if (property.value.propertyType === 'Shop rent') {
    if (property.value.shopSize) features.push(property.value.shopSize)
    if (property.value.roadAccess) features.push('Road access')
    if (property.value.marketArea) features.push('Market area')
    if (property.value.electricityAvailability) features.push('Electricity available')
    if (property.value.security) features.push('Security')
    if (property.value.waterAccess) features.push('Water access')
  } else {
    if (property.value.bedrooms !== null) features.push(`${property.value.bedrooms} bedrooms`)
    if (property.value.bathrooms !== null) features.push(`${property.value.bathrooms} bathrooms`)
    if (property.value.toilets !== null) features.push(`${property.value.toilets} toilets`)
    if (property.value.kitchen) features.push('Kitchen')
    if (property.value.parking) features.push('Parking')
    if (property.value.water) features.push('Water')
    if (property.value.electricity) features.push('Electricity')
    if (property.value.security) features.push('Security')
  }

  return features.filter((feature, index, array) => array.indexOf(feature) === index)
})

async function handleToggleSaved() {
  actionMessage.value = ''

  if (!property.value) {
    return
  }

  try {
    await toggleSavedProperty(state.profile?.uid, property.value)
    actionMessage.value = isSaved.value
      ? 'Property saved to your favorites.'
      : 'Property removed from your saved list.'
  } catch (error) {
    actionMessage.value =
      error instanceof Error ? error.message : 'Could not update the saved property state.'
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}
</script>
