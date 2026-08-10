<template>
  <Teleport to="body">
    <Transition name="listing-quick-view">
      <div
        v-if="isOpen && item"
        class="fixed inset-0 z-[120] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
        role="presentation"
        @mousedown.self="close"
      >
        <section
          ref="dialogRef"
          class="grid max-h-[calc(100dvh-24px)] w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl outline-none md:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] dark:border-slate-700 dark:bg-slate-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-quick-view-title"
          tabindex="-1"
          @keydown="handleKeydown"
        >
          <button
            type="button"
            class="absolute right-5 top-5 z-10 inline-grid h-11 w-11 place-items-center rounded-full bg-white/90 text-lg text-slate-700 shadow-md backdrop-blur transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-slate-950/85 dark:text-white"
            aria-label="Close quick view"
            title="Close"
            @click="close"
          >
            <IonIcon :icon="closeOutline" aria-hidden="true" />
          </button>

          <div
            class="relative min-h-56 overflow-hidden bg-slate-100 md:min-h-[520px] dark:bg-slate-800"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.title"
              class="h-full w-full object-cover"
              decoding="async"
            />
            <span
              v-else
              class="grid h-full min-h-56 place-items-center text-4xl text-slate-400 md:min-h-[520px]"
            >
              <IonIcon :icon="imageOutline" aria-hidden="true" />
            </span>
            <div class="absolute left-4 top-4 flex flex-wrap gap-2">
              <span
                class="rounded-full bg-white/92 px-3 py-1 text-[10px] font-bold text-slate-800 shadow-sm backdrop-blur"
              >
                {{ item.subcategoryName || item.categoryName }}
              </span>
              <span
                v-if="item.availabilityLabel"
                class="rounded-full bg-emerald-50/95 px-3 py-1 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur"
              >
                {{ item.availabilityLabel }}
              </span>
            </div>
          </div>

          <div class="min-h-0 overflow-y-auto p-5 sm:p-7">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">
              Quick view
            </p>
            <h2
              id="listing-quick-view-title"
              class="mt-2 text-2xl font-extrabold tracking-normal text-ink dark:text-white"
            >
              {{ item.title }}
            </h2>
            <p class="mt-2 flex items-start gap-2 text-sm text-slate-500 dark:text-slate-300">
              <IonIcon :icon="locationOutline" class="mt-0.5 shrink-0" aria-hidden="true" />
              {{ item.location || 'Location not added' }}
            </p>

            <p class="mt-5">
              <strong class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {{ item.price }}
              </strong>
              <span
                v-if="item.paymentDuration"
                class="ml-1 text-xs font-medium text-slate-500 dark:text-slate-300"
              >
                / {{ item.paymentDuration }}
              </span>
            </p>

            <div
              v-if="metadata.length"
              class="mt-5 grid grid-cols-2 gap-2 border-y border-slate-200 py-4 sm:grid-cols-4 dark:border-slate-700"
            >
              <span
                v-for="metadataItem in metadata"
                :key="metadataItem.label"
                class="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300"
              >
                <IonIcon
                  :icon="metadataIcon(metadataItem.kind)"
                  class="shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                <span class="min-w-0">
                  <strong class="block truncate text-xs text-ink dark:text-white">
                    {{ metadataItem.value }}
                  </strong>
                  <small class="block truncate text-[10px]">{{ metadataItem.label }}</small>
                </span>
              </span>
            </div>

            <p
              v-if="item.description"
              class="mt-5 line-clamp-4 text-sm leading-6 text-slate-600 dark:text-slate-300"
            >
              {{ item.description }}
            </p>

            <dl
              v-if="knownCharges.length"
              class="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700"
            >
              <div
                v-for="charge in knownCharges"
                :key="charge.label"
                class="flex items-center justify-between gap-4 py-1.5 text-xs"
              >
                <dt class="text-slate-500 dark:text-slate-300">{{ charge.label }}</dt>
                <dd class="font-bold text-ink dark:text-white">
                  {{ formatCurrency(charge.value) }}
                </dd>
              </div>
              <div
                class="mt-2 flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-sm dark:border-slate-700"
              >
                <dt class="font-bold text-ink dark:text-white">Known initial total</dt>
                <dd class="font-extrabold text-ink dark:text-white">
                  {{ formatCurrency(knownTotal) }}
                </dd>
              </div>
            </dl>

            <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-wait disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
                :disabled="isSaving"
                :aria-pressed="isSaved"
                @click="$emit('toggle-saved', item)"
              >
                <IonIcon :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
                {{ isSaved ? 'Saved' : 'Save' }}
              </button>
              <button
                v-if="item.propertyRecord"
                type="button"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200"
                :aria-pressed="isCompared"
                @click="$emit('toggle-compare', item)"
              >
                <IonIcon :icon="gitCompareOutline" aria-hidden="true" />
                {{ isCompared ? 'Comparing' : 'Compare' }}
              </button>
              <a
                v-if="googleMapsUrl"
                :href="googleMapsUrl"
                class="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 sm:col-span-1 dark:border-slate-700 dark:text-slate-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <IonIcon :icon="navigateOutline" aria-hidden="true" />
                Open map
              </a>
            </div>

            <div class="mt-3 grid gap-2 sm:grid-cols-2">
              <RouterLink
                v-if="item.propertyRecord"
                :to="`/booking/${item.id}`"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                <IonIcon :icon="calendarOutline" aria-hidden="true" />
                Book inspection
              </RouterLink>
              <RouterLink
                :to="item.detailPath"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-xs font-bold text-white transition hover:bg-brand-700"
              >
                View full details
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </RouterLink>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  arrowForwardOutline,
  bedOutline,
  briefcaseOutline,
  calendarOutline,
  carOutline,
  closeOutline,
  cubeOutline,
  gitCompareOutline,
  heart,
  heartOutline,
  imageOutline,
  leafOutline,
  locationOutline,
  navigateOutline,
  phonePortraitOutline,
  resizeOutline,
  speedometerOutline,
  storefrontOutline,
  syncOutline,
  timeOutline,
  waterOutline,
} from 'ionicons/icons'
import { computed, ref, toRef } from 'vue'
import { RouterLink } from 'vue-router'

import { useModalDialog } from '../../composables/useModalDialog'
import type { MarketplaceDiscoveryItem, MarketplaceMetadataKind } from '../../types/marketplace'

const props = defineProps<{
  isOpen: boolean
  item: MarketplaceDiscoveryItem | null
  isSaved: boolean
  isCompared: boolean
  isSaving: boolean
}>()

const emit = defineEmits<{
  close: []
  'toggle-saved': [item: MarketplaceDiscoveryItem]
  'toggle-compare': [item: MarketplaceDiscoveryItem]
}>()

const dialogRef = ref<HTMLElement | null>(null)
const openState = toRef(props, 'isOpen')
const { handleKeydown } = useModalDialog(openState, dialogRef, close)

const metadata = computed(() => props.item?.metadata ?? [])

const knownCharges = computed(() => {
  const property = props.item?.propertyRecord
  if (!property) return []

  return [
    { label: 'Rent', value: property.rentPrice },
    { label: 'Inspection fee', value: property.inspectionFee },
    { label: 'Agency fee', value: property.agencyFee },
    { label: 'Caution fee', value: property.cautionFee },
  ].filter((charge) => charge.value > 0)
})

const knownTotal = computed(() =>
  knownCharges.value.reduce((total, charge) => total + charge.value, 0)
)

const googleMapsUrl = computed(() => {
  const property = props.item?.propertyRecord
  if (!property || property.latitude === null || property.longitude === null) return ''

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${property.latitude},${property.longitude}`
  )}`
})

function close() {
  emit('close')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}

function metadataIcon(kind: MarketplaceMetadataKind) {
  const icons: Record<MarketplaceMetadataKind, string> = {
    area: resizeOutline,
    bathrooms: waterOutline,
    bedrooms: bedOutline,
    brand: storefrontOutline,
    condition: syncOutline,
    delivery: carOutline,
    employment: briefcaseOutline,
    mileage: speedometerOutline,
    model: cubeOutline,
    parking: carOutline,
    quantity: leafOutline,
    'service-area': locationOutline,
    storage: phonePortraitOutline,
    transmission: syncOutline,
    workplace: storefrontOutline,
    year: calendarOutline,
  }
  return icons[kind] ?? timeOutline
}
</script>

<style scoped>
.listing-quick-view-enter-active,
.listing-quick-view-leave-active {
  transition: opacity 180ms ease;
}

.listing-quick-view-enter-active > section,
.listing-quick-view-leave-active > section {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.listing-quick-view-enter-from,
.listing-quick-view-leave-to,
.listing-quick-view-enter-from > section,
.listing-quick-view-leave-to > section {
  opacity: 0;
}

.listing-quick-view-enter-from > section,
.listing-quick-view-leave-to > section {
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .listing-quick-view-enter-active,
  .listing-quick-view-leave-active,
  .listing-quick-view-enter-active > section,
  .listing-quick-view-leave-active > section {
    transition: none;
  }
}
</style>
