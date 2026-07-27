<template>
  <AppShell
    eyebrow="Manage"
    title="Edit property"
    description="You can now update your own listing details. Non-admin edits return the property to pending status for review."
  >
    <section v-if="propertyInput" class="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <div class="glass-panel p-6 sm:p-8">
        <PropertyForm
          :initial-value="propertyInput"
          submit-label="Save changes"
          :is-submitting="isSubmitting"
          @submit="handleUpdate"
          @cancel="handleCancel"
        />
      </div>

      <div class="grid gap-4">
        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
            Current listing
          </p>
          <h2 class="mt-3 text-xl font-bold text-ink dark:text-white">{{ property?.title }}</h2>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Status:
            <span class="font-semibold text-ink dark:text-white">{{ property?.status }}</span>
          </p>
        </div>
        <div
          v-if="statusMessage"
          class="rounded-[24px] border px-4 py-4 text-sm"
          :class="
            statusTone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
          "
        >
          {{ statusMessage }}
        </div>
      </div>
    </section>

    <section v-else class="glass-panel p-8 text-center">
      <h2 class="text-2xl font-bold text-ink dark:text-white">{{ pageState.title }}</h2>
      <p class="mx-auto mt-3 max-w-xl text-sm leading-7 text-mist dark:text-slate-300">
        {{ pageState.copy }}
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
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import PropertyForm from '../components/property/PropertyForm.vue'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { createRemotePropertyImage, type PropertyFormInput } from '../types/property'

const route = useRoute()
const router = useRouter()
const { state } = useAuth()
const { findById, saveUpdatedProperty } = useProperties()

const propertyId = route.params.propertyId as string
const property = ref<Awaited<ReturnType<typeof findById>>>(null)

void findById(propertyId).then((result) => {
  property.value = result
})
const isOwnerOrAdmin = computed(
  () =>
    Boolean(property.value) &&
    Boolean(state.profile) &&
    (property.value?.ownerId === state.profile?.uid || state.profile?.role === 'admin')
)

const propertyInput = computed<PropertyFormInput | null>(() => {
  if (!property.value || !isOwnerOrAdmin.value) {
    return null
  }

  return {
    title: property.value.title,
    description: property.value.description,
    category: property.value.category,
    propertyType: property.value.propertyType,
    rentPrice: property.value.rentPrice,
    cautionFee: property.value.cautionFee,
    agencyFee: property.value.agencyFee,
    inspectionFee: property.value.inspectionFee,
    paymentDuration: property.value.paymentDuration,
    state: property.value.state,
    city: property.value.city,
    area: property.value.area,
    address: property.value.address,
    latitude: property.value.latitude,
    longitude: property.value.longitude,
    bedrooms: property.value.bedrooms,
    bathrooms: property.value.bathrooms,
    toilets: property.value.toilets,
    shopSize: property.value.shopSize,
    roadAccess: property.value.roadAccess,
    marketArea: property.value.marketArea,
    electricityAvailability: property.value.electricityAvailability,
    security: property.value.security,
    waterAccess: property.value.waterAccess,
    kitchen: property.value.kitchen,
    parking: property.value.parking,
    water: property.value.water,
    electricity: property.value.electricity,
    amenities: property.value.amenities,
    images: property.value.images.map((image) => createRemotePropertyImage(image)),
    ownerPhone: property.value.ownerPhone,
    isAvailable: property.value.isAvailable,
    availabilityConfig: property.value.availabilityConfig ?? {
      agents: [],
      limitedRemainingCapacity: 3,
      blockedDates: [],
      bufferMinutes: null,
      minimumDurationMinutes: null,
    },
  }
})

const pageState = computed(() => {
  if (!property.value) {
    return {
      title: 'Property not found',
      copy: 'The property you are trying to edit does not exist in local storage.',
    }
  }

  if (!isOwnerOrAdmin.value) {
    return {
      title: 'You cannot edit this listing',
      copy: 'Only the property owner or an admin can edit this listing in the current phase.',
    }
  }

  return {
    title: '',
    copy: '',
  }
})

const isSubmitting = ref(false)
const statusMessage = ref('')
const statusTone = ref<'error' | 'success'>('error')

async function handleUpdate(value: PropertyFormInput) {
  statusMessage.value = ''

  if (!state.profile) {
    statusTone.value = 'error'
    statusMessage.value = 'You need to be signed in before editing a property.'
    return
  }

  isSubmitting.value = true

  try {
    const updated = await saveUpdatedProperty(propertyId, value, state.profile)
    statusTone.value = 'success'
    statusMessage.value = 'Property updated successfully. Redirecting to the details page...'
    await router.replace(`/properties/${updated.id}`)
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Could not update property.'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  void router.push(`/properties/${propertyId}`)
}
</script>
