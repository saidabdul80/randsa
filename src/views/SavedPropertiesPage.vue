<template>
  <AppShell
    eyebrow="Saved"
    title="Saved properties"
    description="Your favorite properties now live here for quick return visits."
  >
    <p
      v-if="actionMessage"
      class="mb-4 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
    >
      {{ actionMessage }}
    </p>

    <section v-if="savedProperties.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in savedProperties"
        :key="item.id"
        class="glass-panel overflow-hidden"
      >
        <img
          :src="item.images[0] || fallbackImage"
          alt="Saved property cover"
          class="h-44 w-full object-cover"
        >
        <div class="p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-ink dark:text-white">{{ item.title }}</h2>
              <p class="mt-1 text-sm text-mist dark:text-slate-300">
                {{ item.area }}, {{ item.city }}, {{ item.state }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-200"
              @click="handleRemove(item.id)"
            >
              Remove
            </button>
          </div>
          <p class="mt-4 text-xl font-bold text-ink dark:text-white">
            {{ formatCurrency(item.rentPrice) }} / {{ item.paymentDuration }}
          </p>
          <div class="mt-4 flex items-center justify-between text-sm">
            <span class="text-mist dark:text-slate-300">{{ item.propertyType }}</span>
            <RouterLink :to="`/properties/${item.id}`" class="font-semibold text-brand-700">
              View details
            </RouterLink>
          </div>
        </div>
      </article>
    </section>

    <section v-else class="glass-panel grid place-items-center p-10 text-center sm:p-14">
      <div class="max-w-md">
        <div class="mx-auto h-20 w-20 rounded-[28px] bg-brand-50" />
        <h2 class="mt-6 text-2xl font-bold text-ink dark:text-white">Nothing saved yet</h2>
        <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
          Tap the save action on any property details page and your favorites will appear here.
        </p>
        <RouterLink
          to="/properties"
          class="mt-6 inline-flex rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Browse listings
        </RouterLink>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { useSavedProperties } from '../composables/useSavedProperties'

const fallbackImage =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22240%22 viewBox=%220 0 400 240%22%3E%3Crect width=%22400%22 height=%22240%22 fill=%22%23dbeeff%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23185ac8%22 font-family=%22Segoe UI%22 font-size=%2220%22%3ERANDSA Property%3C/text%3E%3C/svg%3E'

const { state } = useAuth()
const { properties, refresh } = useProperties()
const { refresh: refreshSaved, savedRecords, toggleSavedProperty } = useSavedProperties()
const actionMessage = ref('')

watch(
  () => state.profile?.uid,
  (userId) => {
    refreshSaved(userId)
  },
  { immediate: true },
)

void refresh()

const savedProperties = computed(() => {
  const ids = new Set(savedRecords.value.map((record) => record.propertyId))
  return properties.value.filter((property) => ids.has(property.id))
})

async function handleRemove(propertyId: string) {
  actionMessage.value = ''

  const property = savedProperties.value.find((item) => item.id === propertyId)

  if (!property) {
    return
  }

  try {
    await toggleSavedProperty(state.profile?.uid, property)
  } catch (error) {
    actionMessage.value =
      error instanceof Error ? error.message : 'Could not remove the saved property.'
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
