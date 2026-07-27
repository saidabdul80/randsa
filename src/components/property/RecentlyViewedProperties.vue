<template>
  <section
    v-if="properties.length"
    class="mt-10 border-t border-slate-200 pt-8 dark:border-slate-800"
    aria-labelledby="recently-viewed-title"
  >
    <div class="flex items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">
          Pick up where you left off
        </p>
        <h2
          id="recently-viewed-title"
          class="mt-1 text-2xl font-extrabold tracking-normal text-ink dark:text-white sm:text-3xl"
        >
          Recently viewed
        </h2>
      </div>
      <button
        type="button"
        class="min-h-10 shrink-0 px-2 text-xs font-bold text-slate-500 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:text-white"
        @click="$emit('clear')"
      >
        Clear history
      </button>
    </div>

    <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <button
        v-for="property in properties"
        :key="property.id"
        type="button"
        class="group min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-[0_12px_28px_-24px_rgba(16,32,51,0.5)] transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_18px_34px_-24px_rgba(16,32,51,0.62)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-800 dark:bg-slate-900"
        :aria-label="`Quick view ${property.title}`"
        @click="$emit('quick-view', property)"
      >
        <span class="block aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            v-if="property.images[0]"
            :src="property.images[0]"
            :alt="property.title"
            class="h-full w-full object-cover transition duration-200 group-hover:scale-[1.025]"
            loading="lazy"
            decoding="async"
          />
          <span v-else class="grid h-full place-items-center text-3xl text-slate-400">
            <IonIcon :icon="imageOutline" aria-hidden="true" />
          </span>
        </span>
        <span class="block min-w-0 p-3">
          <strong class="block truncate text-xs font-extrabold text-ink dark:text-white sm:text-sm">
            {{ property.title }}
          </strong>
          <small class="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-300">
            {{ formatLocation(property) }}
          </small>
          <span
            class="mt-3 block truncate text-xs font-extrabold text-emerald-600 dark:text-emerald-400"
          >
            {{ formatCurrency(property.rentPrice) }}
            <small class="font-medium text-slate-500 dark:text-slate-300">
              / {{ formatPeriod(property.paymentDuration) }}
            </small>
          </span>
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { imageOutline } from 'ionicons/icons'

import type { PropertyRecord } from '../../types/property'

defineProps<{
  properties: PropertyRecord[]
}>()

defineEmits<{
  clear: []
  'quick-view': [property: PropertyRecord]
}>()

function formatLocation(property: PropertyRecord) {
  return [property.area, property.city, property.state].filter(Boolean).join(', ')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPeriod(value: string) {
  return value.replaceAll('_', ' ')
}
</script>
