<template>
  <Transition name="property-compare-tray">
    <aside
      v-if="properties.length"
      class="property-compare-tray"
      :class="{ 'property-compare-tray--marketplace': placement === 'marketplace' }"
      aria-label="Selected properties for comparison"
    >
      <div class="property-compare-tray__items">
        <div v-for="property in properties" :key="property.id">
          <img
            v-if="property.images[0]"
            :src="property.images[0]"
            :alt="property.title"
            loading="lazy"
          />
          <span v-else aria-hidden="true">
            <IonIcon :icon="imageOutline" />
          </span>
          <strong>{{ property.title }}</strong>
          <button
            type="button"
            :aria-label="`Remove ${property.title} from comparison`"
            @click="$emit('remove', property.id)"
          >
            <IonIcon :icon="closeOutline" aria-hidden="true" />
          </button>
        </div>
      </div>
      <span class="property-compare-tray__count">{{ properties.length }} / 3 selected</span>
      <button type="button" class="property-compare-tray__clear" @click="$emit('clear')">
        Clear all
      </button>
      <button
        type="button"
        class="property-compare-tray__open"
        :disabled="properties.length < 2"
        @click="openComparison"
      >
        <IonIcon :icon="gitCompareOutline" aria-hidden="true" />
        Compare
      </button>
    </aside>
  </Transition>

  <Teleport to="body">
    <Transition name="property-compare-modal">
      <div
        v-if="isOpen"
        class="property-compare-backdrop"
        role="presentation"
        @mousedown.self="closeComparison"
      >
        <section
          ref="dialogRef"
          class="property-compare-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="property-compare-title"
          tabindex="-1"
          @keydown="handleKeydown"
        >
          <header>
            <div>
              <p>Side-by-side review</p>
              <h2 id="property-compare-title">Compare properties</h2>
              <span>Review up to three selected listings using available listing data.</span>
            </div>
            <button type="button" aria-label="Close property comparison" @click="closeComparison">
              <IonIcon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <div class="property-compare-modal__table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th v-for="property in properties" :key="property.id" scope="col">
                    <div class="property-compare-modal__property">
                      <img
                        v-if="property.images[0]"
                        :src="property.images[0]"
                        :alt="property.title"
                      />
                      <span v-else aria-hidden="true"><IonIcon :icon="imageOutline" /></span>
                      <strong>{{ property.title }}</strong>
                      <small>{{ formatLocation(property) }}</small>
                      <button type="button" @click="$emit('remove', property.id)">Remove</button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in visibleRows" :key="row.label">
                  <th scope="row">{{ row.label }}</th>
                  <td v-for="property in properties" :key="`${row.label}-${property.id}`">
                    {{ row.value(property) || '—' }}
                  </td>
                </tr>
                <tr>
                  <th scope="row">Actions</th>
                  <td v-for="property in properties" :key="`actions-${property.id}`">
                    <div class="property-compare-modal__actions">
                      <button
                        type="button"
                        :disabled="savingPropertyId === property.id"
                        @click="$emit('toggle-saved', property)"
                      >
                        <IonSpinner
                          v-if="savingPropertyId === property.id"
                          name="crescent"
                          aria-hidden="true"
                        />
                        <IonIcon
                          v-else
                          :icon="savedPropertyIds.has(property.id) ? heart : heartOutline"
                          aria-hidden="true"
                        />
                        {{ savedPropertyIds.has(property.id) ? 'Saved' : 'Save' }}
                      </button>
                      <RouterLink :to="`/booking/${property.id}`">Book inspection</RouterLink>
                      <RouterLink :to="`/properties/${property.id}`">Open details</RouterLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer>
            <button type="button" @click="$emit('clear')">Clear comparison</button>
            <button type="button" @click="closeComparison">Done</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import { closeOutline, gitCompareOutline, heart, heartOutline, imageOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useModalDialog } from '../../../composables/useModalDialog'
import type { PropertyRecord } from '../../../types/property'

const props = withDefaults(
  defineProps<{
    properties: PropertyRecord[]
    savedPropertyIds: Set<string>
    savingPropertyId: string
    placement?: 'details' | 'marketplace'
  }>(),
  {
    placement: 'details',
  }
)

defineEmits<{
  remove: [propertyId: string]
  clear: []
  'toggle-saved': [property: PropertyRecord]
}>()

interface ComparisonRow {
  label: string
  value: (property: PropertyRecord) => string
}

const isOpen = ref(false)
const dialogRef = ref<HTMLElement | null>(null)

const rows: ComparisonRow[] = [
  {
    label: 'Price',
    value: (property) =>
      `${formatCurrency(property.rentPrice)} / ${formatPeriod(property.paymentDuration)}`,
  },
  { label: 'Location', value: formatLocation },
  { label: 'Property type', value: (property) => property.propertyType },
  {
    label: 'Bedrooms',
    value: (property) => (property.bedrooms === null ? '' : String(property.bedrooms)),
  },
  {
    label: 'Bathrooms',
    value: (property) => (property.bathrooms === null ? '' : String(property.bathrooms)),
  },
  {
    label: 'Toilets',
    value: (property) => (property.toilets === null ? '' : String(property.toilets)),
  },
  { label: 'Shop size', value: (property) => property.shopSize },
  { label: 'Parking', value: (property) => (property.parking ? 'Available' : '') },
  {
    label: 'Inspection fee',
    value: (property) => (property.inspectionFee > 0 ? formatCurrency(property.inspectionFee) : ''),
  },
  {
    label: 'Agency fee',
    value: (property) => (property.agencyFee > 0 ? formatCurrency(property.agencyFee) : ''),
  },
  {
    label: 'Caution fee',
    value: (property) => (property.cautionFee > 0 ? formatCurrency(property.cautionFee) : ''),
  },
  {
    label: 'Availability',
    value: (property) => (property.isAvailable ? 'Available' : 'Unavailable'),
  },
  { label: 'Listing status', value: (property) => titleCase(property.status) },
  {
    label: 'Amenities',
    value: (property) => property.amenities.filter(Boolean).slice(0, 6).join(', '),
  },
  {
    label: 'Listed',
    value: (property) => formatDate(property.createdAt),
  },
]

const visibleRows = computed(() =>
  rows.filter((row) => props.properties.some((property) => Boolean(row.value(property))))
)
const { handleKeydown } = useModalDialog(isOpen, dialogRef, closeComparison)

function openComparison() {
  if (!props.properties.length) return
  isOpen.value = true
}

function closeComparison() {
  isOpen.value = false
}

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

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

defineExpose({ openComparison })
</script>

<style scoped>
.property-compare-tray {
  position: fixed;
  z-index: 80;
  right: 390px;
  bottom: 18px;
  left: 250px;
  display: flex;
  width: min(780px, calc(100vw - 680px));
  min-height: 68px;
  align-items: center;
  gap: 12px;
  margin: 0 auto;
  border: 1px solid rgb(191 219 254);
  border-radius: 16px;
  background: rgb(255 255 255 / 0.94);
  padding: 9px 11px;
  box-shadow: 0 20px 46px -24px rgb(15 23 42 / 0.48);
  backdrop-filter: blur(16px);
}

.property-compare-tray--marketplace {
  right: 20px;
  left: 20px;
  width: min(780px, calc(100vw - 40px));
}

.property-compare-tray__items {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 7px;
}

.property-compare-tray__items > div {
  display: grid;
  min-width: 0;
  max-width: 150px;
  grid-template-columns: 36px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  background: rgb(248 250 252);
  padding: 5px;
}

.property-compare-tray__items img,
.property-compare-tray__items span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 7px;
  background: rgb(226 232 240);
  color: rgb(100 116 139);
  object-fit: cover;
}

.property-compare-tray__items strong {
  overflow: hidden;
  color: rgb(30 41 59);
  font-size: 9px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-compare-tray__items button {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 6px;
  color: rgb(100 116 139);
}

.property-compare-tray__count {
  flex: 0 0 auto;
  color: rgb(100 116 139);
  font-size: 9px;
  font-weight: 700;
}

.property-compare-tray__clear,
.property-compare-tray__open {
  min-height: 38px;
  flex: 0 0 auto;
  border-radius: 9px;
  padding: 0 11px;
  font-size: 10px;
  font-weight: 800;
}

.property-compare-tray__clear {
  color: rgb(71 85 105);
}

.property-compare-tray__open {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgb(37 99 235);
  color: white;
}

.property-compare-tray__open:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.property-compare-backdrop {
  position: fixed;
  inset: 0;
  z-index: 125;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(15 23 42 / 0.58);
  backdrop-filter: blur(7px);
}

.property-compare-modal {
  display: grid;
  width: min(1120px, 100%);
  max-height: calc(100dvh - 40px);
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 18px;
  background: white;
  box-shadow: 0 34px 90px -34px rgb(15 23 42 / 0.65);
  outline: none;
}

.property-compare-modal > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 22px;
  border-bottom: 1px solid rgb(226 232 240);
}

.property-compare-modal > header p {
  color: rgb(37 99 235);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.property-compare-modal > header h2 {
  margin-top: 4px;
  color: rgb(15 23 42);
  font-size: 22px;
  font-weight: 850;
}

.property-compare-modal > header span {
  display: block;
  margin-top: 4px;
  color: rgb(100 116 139);
  font-size: 10px;
}

.property-compare-modal > header button {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(226 232 240);
  border-radius: 50%;
  color: rgb(51 65 85);
  font-size: 18px;
}

.property-compare-modal__table-wrap {
  overflow: auto;
}

.property-compare-modal table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  table-layout: fixed;
}

.property-compare-modal th,
.property-compare-modal td {
  padding: 12px 14px;
  border-right: 1px solid rgb(241 245 249);
  border-bottom: 1px solid rgb(241 245 249);
  color: rgb(51 65 85);
  font-size: 10px;
  line-height: 1.5;
  text-align: left;
  vertical-align: top;
}

.property-compare-modal th:first-child {
  width: 140px;
}

.property-compare-modal tbody th {
  color: rgb(100 116 139);
  font-weight: 800;
}

.property-compare-modal__property {
  display: grid;
  gap: 5px;
}

.property-compare-modal__property img,
.property-compare-modal__property > span {
  display: grid;
  width: 100%;
  aspect-ratio: 16 / 9;
  place-items: center;
  overflow: hidden;
  border-radius: 10px;
  background: rgb(241 245 249);
  color: rgb(148 163 184);
  object-fit: cover;
}

.property-compare-modal__property strong {
  overflow: hidden;
  margin-top: 4px;
  color: rgb(15 23 42);
  font-size: 12px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-compare-modal__property small {
  overflow: hidden;
  color: rgb(100 116 139);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-compare-modal__property button {
  justify-self: start;
  color: rgb(225 29 72);
  font-size: 9px;
  font-weight: 800;
}

.property-compare-modal__actions {
  display: grid;
  gap: 6px;
}

.property-compare-modal__actions button,
.property-compare-modal__actions a {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid rgb(203 213 225);
  border-radius: 8px;
  padding: 0 8px;
  color: rgb(51 65 85);
  font-size: 9px;
  font-weight: 800;
}

.property-compare-modal__actions a:nth-child(2) {
  border-color: rgb(37 99 235);
  background: rgb(37 99 235);
  color: white;
}

.property-compare-modal > footer {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding: 14px 20px;
  border-top: 1px solid rgb(226 232 240);
}

.property-compare-modal > footer button {
  min-height: 40px;
  border-radius: 9px;
  padding: 0 14px;
  color: rgb(71 85 105);
  font-size: 10px;
  font-weight: 800;
}

.property-compare-modal > footer button:last-child {
  background: rgb(37 99 235);
  color: white;
}

.property-compare-tray-enter-active,
.property-compare-tray-leave-active,
.property-compare-modal-enter-active,
.property-compare-modal-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.property-compare-tray-enter-from,
.property-compare-tray-leave-to,
.property-compare-modal-enter-from,
.property-compare-modal-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

:global(.dark) .property-compare-tray,
:global(.dark) .property-compare-modal {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42 / 0.96);
}

:global(.dark) .property-compare-tray__items > div,
:global(.dark) .property-compare-modal__property > span {
  background: rgb(30 41 59);
}

:global(.dark) .property-compare-tray__items strong,
:global(.dark) .property-compare-modal > header h2,
:global(.dark) .property-compare-modal__property strong {
  color: white;
}

:global(.dark) .property-compare-modal th,
:global(.dark) .property-compare-modal td,
:global(.dark) .property-compare-modal > header,
:global(.dark) .property-compare-modal > footer {
  border-color: rgb(51 65 85);
  color: rgb(226 232 240);
}

@media (max-width: 1279px) {
  .property-compare-tray {
    right: 24px;
    left: 230px;
    width: min(720px, calc(100vw - 278px));
  }

  .property-compare-tray--marketplace {
    right: 20px;
    left: 20px;
    width: min(720px, calc(100vw - 40px));
  }
}

@media (max-width: 1023px) {
  .property-compare-tray:not(.property-compare-tray--marketplace) {
    display: none;
  }

  .property-compare-tray--marketplace {
    right: 14px;
    bottom: 14px;
    left: 14px;
    width: min(680px, calc(100vw - 28px));
  }
}

@media (max-width: 640px) {
  .property-compare-tray--marketplace {
    min-height: 58px;
    gap: 7px;
    padding: 8px;
  }

  .property-compare-tray--marketplace .property-compare-tray__items {
    display: none;
  }

  .property-compare-tray--marketplace .property-compare-tray__count {
    flex: 1;
    padding-left: 4px;
    font-size: 10px;
  }

  .property-compare-tray--marketplace .property-compare-tray__clear,
  .property-compare-tray--marketplace .property-compare-tray__open {
    min-height: 40px;
  }

  .property-compare-backdrop {
    padding: 10px;
  }

  .property-compare-modal {
    max-height: calc(100dvh - 20px);
    border-radius: 15px;
  }

  .property-compare-modal > header {
    padding: 16px;
  }

  .property-compare-modal th:first-child {
    width: 108px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .property-compare-tray-enter-active,
  .property-compare-tray-leave-active,
  .property-compare-modal-enter-active,
  .property-compare-modal-leave-active {
    transition: none;
  }
}
</style>
