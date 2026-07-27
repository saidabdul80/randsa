<template>
  <section class="similar-properties" aria-labelledby="similar-properties-title">
    <header>
      <div>
        <p>Continue exploring</p>
        <h2 id="similar-properties-title">Similar properties</h2>
        <span>You may also like these nearby listings.</span>
      </div>
      <div class="similar-properties__header-actions">
        <button
          v-if="properties.length > 1"
          type="button"
          aria-label="Scroll similar properties backward"
          @click="scrollCards(-1)"
        >
          <IonIcon :icon="chevronBackOutline" aria-hidden="true" />
        </button>
        <button
          v-if="properties.length > 1"
          type="button"
          aria-label="Scroll similar properties forward"
          @click="scrollCards(1)"
        >
          <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
        </button>
        <RouterLink :to="exploreLink">View all</RouterLink>
      </div>
    </header>

    <div
      v-if="properties.length"
      ref="scrollerRef"
      class="similar-properties__scroller"
      role="list"
      tabindex="0"
      @keydown.left.prevent="scrollCards(-1)"
      @keydown.right.prevent="scrollCards(1)"
    >
      <article v-for="property in properties" :key="property.id" role="listitem">
        <div class="similar-property-card__media">
          <img
            v-if="property.images[0]"
            :src="property.images[0]"
            :alt="`${property.title} in ${property.area || property.city}`"
            loading="lazy"
            decoding="async"
          />
          <span v-else class="similar-property-card__placeholder">
            <IonIcon :icon="imageOutline" aria-hidden="true" />
          </span>
          <span class="similar-property-card__availability">
            {{ property.isAvailable ? 'Available' : 'Unavailable' }}
          </span>
          <button
            type="button"
            class="similar-property-card__save"
            :aria-label="
              savedPropertyIds.has(property.id)
                ? `Remove ${property.title} from saved properties`
                : `Save ${property.title}`
            "
            :aria-pressed="savedPropertyIds.has(property.id)"
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
          </button>
        </div>

        <div class="similar-property-card__body">
          <p>{{ property.propertyType }}</p>
          <h3>{{ property.title }}</h3>
          <span class="similar-property-card__location">
            <IonIcon :icon="locationOutline" aria-hidden="true" />
            {{ formatLocation(property) }}
          </span>
          <div v-if="factLine(property)" class="similar-property-card__facts">
            {{ factLine(property) }}
          </div>
          <strong>
            {{ formatCurrency(property.rentPrice) }}
            <small>/ {{ formatPeriod(property.paymentDuration) }}</small>
          </strong>
        </div>

        <footer>
          <button type="button" @click="openQuickView(property)">Quick view</button>
          <button
            type="button"
            :class="{ 'is-selected': comparisonPropertyIds.includes(property.id) }"
            :disabled="comparisonIsFull && !comparisonPropertyIds.includes(property.id)"
            @click="$emit('toggle-compare', property)"
          >
            <IonIcon :icon="gitCompareOutline" aria-hidden="true" />
            {{ comparisonPropertyIds.includes(property.id) ? 'Added' : 'Compare' }}
          </button>
          <RouterLink :to="`/properties/${property.id}`" :aria-label="`View ${property.title}`">
            <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
          </RouterLink>
        </footer>
      </article>
    </div>

    <div v-else class="similar-properties__empty">
      <IonIcon :icon="searchOutline" aria-hidden="true" />
      <div>
        <strong>No similar approved listings yet</strong>
        <span>Explore the full marketplace to discover more rentals.</span>
      </div>
      <RouterLink to="/properties">Explore properties</RouterLink>
    </div>

    <Teleport to="body">
      <Transition name="similar-quick-view">
        <div
          v-if="quickViewProperty"
          class="similar-quick-view-backdrop"
          role="presentation"
          @mousedown.self="closeQuickView"
        >
          <section
            ref="quickViewDialogRef"
            class="similar-quick-view"
            role="dialog"
            aria-modal="true"
            aria-labelledby="similar-quick-view-title"
            tabindex="-1"
            @keydown="handleQuickViewKeydown"
          >
            <button type="button" aria-label="Close quick view" @click="closeQuickView">
              <IonIcon :icon="closeOutline" aria-hidden="true" />
            </button>
            <img
              v-if="quickViewProperty.images[0]"
              :src="quickViewProperty.images[0]"
              :alt="quickViewProperty.title"
            />
            <div v-else class="similar-quick-view__placeholder">
              <IonIcon :icon="imageOutline" aria-hidden="true" />
            </div>
            <div class="similar-quick-view__content">
              <p>{{ quickViewProperty.propertyType }}</p>
              <h2 id="similar-quick-view-title">{{ quickViewProperty.title }}</h2>
              <span>
                <IonIcon :icon="locationOutline" aria-hidden="true" />
                {{ formatLocation(quickViewProperty) }}
              </span>
              <strong>
                {{ formatCurrency(quickViewProperty.rentPrice) }}
                <small>/ {{ formatPeriod(quickViewProperty.paymentDuration) }}</small>
              </strong>
              <div v-if="quickViewFacts.length" class="similar-quick-view__facts">
                <span v-for="fact in quickViewFacts" :key="fact">{{ fact }}</span>
              </div>
              <div class="similar-quick-view__actions">
                <button
                  type="button"
                  :disabled="savingPropertyId === quickViewProperty.id"
                  @click="$emit('toggle-saved', quickViewProperty)"
                >
                  <IonIcon
                    :icon="savedPropertyIds.has(quickViewProperty.id) ? heart : heartOutline"
                    aria-hidden="true"
                  />
                  {{ savedPropertyIds.has(quickViewProperty.id) ? 'Saved' : 'Save property' }}
                </button>
                <RouterLink :to="`/booking/${quickViewProperty.id}`">Book inspection</RouterLink>
                <RouterLink :to="`/properties/${quickViewProperty.id}`">
                  View full details
                </RouterLink>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  arrowForwardOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  gitCompareOutline,
  heart,
  heartOutline,
  imageOutline,
  locationOutline,
  searchOutline,
} from 'ionicons/icons'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { useModalDialog } from '../../../composables/useModalDialog'
import type { PropertyRecord } from '../../../types/property'

const props = defineProps<{
  properties: PropertyRecord[]
  currentProperty: PropertyRecord
  savedPropertyIds: Set<string>
  savingPropertyId: string
  comparisonPropertyIds: string[]
  comparisonIsFull: boolean
}>()

defineEmits<{
  'toggle-saved': [property: PropertyRecord]
  'toggle-compare': [property: PropertyRecord]
}>()

const scrollerRef = ref<HTMLElement | null>(null)
const quickViewProperty = ref<PropertyRecord | null>(null)
const quickViewDialogRef = ref<HTMLElement | null>(null)
const quickViewIsOpen = computed(() => Boolean(quickViewProperty.value))
const exploreLink = computed(() => ({
  path: '/properties',
  query: { propertyType: props.currentProperty.propertyType },
}))
const quickViewFacts = computed(() => {
  const property = quickViewProperty.value
  if (!property) return []

  return [
    property.bedrooms !== null ? `${property.bedrooms} bedrooms` : '',
    property.bathrooms !== null ? `${property.bathrooms} bathrooms` : '',
    property.toilets !== null ? `${property.toilets} toilets` : '',
    property.shopSize,
  ].filter(Boolean)
})
const { handleKeydown: handleQuickViewKeydown } = useModalDialog(
  quickViewIsOpen,
  quickViewDialogRef,
  closeQuickView
)

function scrollCards(direction: -1 | 1) {
  const distance = Math.max((scrollerRef.value?.clientWidth ?? 320) * 0.8, 280)
  scrollerRef.value?.scrollBy({ left: direction * distance, behavior: 'smooth' })
}

function openQuickView(property: PropertyRecord) {
  quickViewProperty.value = property
}

function closeQuickView() {
  quickViewProperty.value = null
}

function formatLocation(property: PropertyRecord) {
  return [property.area, property.city, property.state].filter(Boolean).join(', ')
}

function factLine(property: PropertyRecord) {
  return [
    property.bedrooms !== null ? `${property.bedrooms} bed` : '',
    property.bathrooms !== null ? `${property.bathrooms} bath` : '',
    property.shopSize,
  ]
    .filter(Boolean)
    .join(' · ')
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

<style scoped>
.similar-properties {
  min-width: 0;
  padding: 22px;
  border: 1px solid rgb(226 232 240);
  border-radius: 18px;
  background: rgb(255 255 255 / 0.94);
}

.similar-properties > header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 17px;
}

.similar-properties > header p {
  color: rgb(37 99 235);
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.similar-properties > header h2 {
  margin-top: 5px;
  color: rgb(15 23 42);
  font-size: 21px;
  font-weight: 850;
}

.similar-properties > header span {
  display: block;
  margin-top: 5px;
  color: rgb(100 116 139);
  font-size: 11px;
}

.similar-properties__header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 7px;
}

.similar-properties__header-actions button {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgb(226 232 240);
  border-radius: 10px;
  color: rgb(51 65 85);
}

.similar-properties__header-actions a {
  min-height: 38px;
  padding: 0 8px;
  color: rgb(37 99 235);
  font-size: 11px;
  font-weight: 800;
  line-height: 38px;
}

.similar-properties__scroller {
  display: grid;
  grid-auto-columns: calc((100% - 42px) / 4);
  grid-auto-flow: column;
  gap: 14px;
  overflow-x: auto;
  padding: 1px 1px 8px;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  outline: none;
}

.similar-properties__scroller > article {
  display: grid;
  min-width: 0;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 14px;
  background: white;
  scroll-snap-align: start;
  transition:
    border-color 200ms ease,
    transform 200ms ease,
    box-shadow 200ms ease;
}

.similar-properties__scroller > article:hover {
  border-color: rgb(191 219 254);
  box-shadow: 0 16px 30px -26px rgb(15 23 42 / 0.45);
  transform: translateY(-2px);
}

.similar-property-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: rgb(241 245 249);
}

.similar-property-card__media > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 200ms ease;
}

article:hover .similar-property-card__media > img {
  transform: scale(1.025);
}

.similar-property-card__placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: rgb(148 163 184);
  font-size: 32px;
}

.similar-property-card__availability {
  position: absolute;
  top: 9px;
  left: 9px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.9);
  padding: 5px 8px;
  color: rgb(5 150 105);
  font-size: 9px;
  font-weight: 850;
  backdrop-filter: blur(8px);
}

.similar-property-card__save {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.75);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.9);
  color: rgb(225 29 72);
  font-size: 17px;
  backdrop-filter: blur(8px);
}

.similar-property-card__body {
  min-width: 0;
  padding: 13px;
}

.similar-property-card__body > p {
  color: rgb(37 99 235);
  font-size: 9px;
  font-weight: 850;
  text-transform: uppercase;
}

.similar-property-card__body h3 {
  overflow: hidden;
  margin-top: 5px;
  color: rgb(15 23 42);
  font-size: 13px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-property-card__location {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  margin-top: 6px;
  color: rgb(100 116 139);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-property-card__facts {
  margin-top: 8px;
  color: rgb(71 85 105);
  font-size: 9px;
  font-weight: 700;
}

.similar-property-card__body > strong {
  display: block;
  overflow: hidden;
  margin-top: 11px;
  color: rgb(5 150 105);
  font-size: 13px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.similar-property-card__body small {
  color: rgb(100 116 139);
  font-size: 9px;
  font-weight: 600;
  text-transform: capitalize;
}

.similar-properties article > footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 36px;
  gap: 5px;
  padding: 0 10px 10px;
}

.similar-properties article > footer button,
.similar-properties article > footer a {
  display: inline-flex;
  min-width: 0;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 9px;
  background: rgb(248 250 252);
  padding: 0 5px;
  color: rgb(51 65 85);
  font-size: 9px;
  font-weight: 800;
}

.similar-properties article > footer button.is-selected {
  background: rgb(239 246 255);
  color: rgb(37 99 235);
}

.similar-properties article > footer button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.similar-properties__empty {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px dashed rgb(203 213 225);
  border-radius: 14px;
  padding: 18px;
  color: rgb(37 99 235);
}

.similar-properties__empty > ion-icon {
  font-size: 28px;
}

.similar-properties__empty strong {
  display: block;
  color: rgb(15 23 42);
  font-size: 12px;
}

.similar-properties__empty span {
  display: block;
  margin-top: 3px;
  color: rgb(100 116 139);
  font-size: 10px;
}

.similar-properties__empty a {
  color: rgb(37 99 235);
  font-size: 10px;
  font-weight: 800;
}

.similar-quick-view-backdrop {
  position: fixed;
  inset: 0;
  z-index: 115;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(15 23 42 / 0.56);
  backdrop-filter: blur(7px);
}

.similar-quick-view {
  position: relative;
  display: grid;
  width: min(760px, 100%);
  max-height: calc(100dvh - 40px);
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 18px;
  background: white;
  box-shadow: 0 30px 80px -30px rgb(15 23 42 / 0.6);
  outline: none;
}

.similar-quick-view > button {
  position: absolute;
  z-index: 2;
  top: 12px;
  right: 12px;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgb(226 232 240);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.9);
  color: rgb(15 23 42);
  font-size: 18px;
}

.similar-quick-view > img,
.similar-quick-view__placeholder {
  width: 100%;
  height: 100%;
  min-height: 390px;
  object-fit: cover;
}

.similar-quick-view__placeholder {
  display: grid;
  place-items: center;
  background: rgb(241 245 249);
  color: rgb(148 163 184);
  font-size: 42px;
}

.similar-quick-view__content {
  align-self: center;
  min-width: 0;
  padding: 52px 26px 26px;
}

.similar-quick-view__content > p {
  color: rgb(37 99 235);
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
}

.similar-quick-view__content h2 {
  margin-top: 7px;
  color: rgb(15 23 42);
  font-size: 23px;
  font-weight: 850;
}

.similar-quick-view__content > span {
  display: flex;
  gap: 5px;
  margin-top: 8px;
  color: rgb(100 116 139);
  font-size: 11px;
}

.similar-quick-view__content > strong {
  display: block;
  margin-top: 18px;
  color: rgb(5 150 105);
  font-size: 21px;
  font-weight: 850;
}

.similar-quick-view__content small {
  color: rgb(100 116 139);
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}

.similar-quick-view__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 15px;
}

.similar-quick-view__facts span {
  border-radius: 999px;
  background: rgb(241 245 249);
  padding: 6px 9px;
  color: rgb(71 85 105);
  font-size: 9px;
  font-weight: 700;
}

.similar-quick-view__actions {
  display: grid;
  gap: 8px;
  margin-top: 20px;
}

.similar-quick-view__actions button,
.similar-quick-view__actions a {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid rgb(203 213 225);
  border-radius: 10px;
  color: rgb(51 65 85);
  font-size: 10px;
  font-weight: 800;
}

.similar-quick-view__actions a:nth-child(2) {
  border-color: rgb(37 99 235);
  background: rgb(37 99 235);
  color: white;
}

.similar-quick-view-enter-active,
.similar-quick-view-leave-active {
  transition: opacity 200ms ease;
}

.similar-quick-view-enter-from,
.similar-quick-view-leave-to {
  opacity: 0;
}

button:focus-visible,
a:focus-visible,
.similar-properties__scroller:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

:global(.dark) .similar-properties,
:global(.dark) .similar-properties__scroller > article,
:global(.dark) .similar-quick-view {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
}

:global(.dark) .similar-properties > header h2,
:global(.dark) .similar-property-card__body h3,
:global(.dark) .similar-properties__empty strong,
:global(.dark) .similar-quick-view__content h2 {
  color: white;
}

:global(.dark) .similar-properties article > footer button,
:global(.dark) .similar-properties article > footer a,
:global(.dark) .similar-quick-view__facts span {
  background: rgb(30 41 59);
  color: rgb(226 232 240);
}

@media (max-width: 1399px) {
  .similar-properties__scroller {
    grid-auto-columns: calc((100% - 28px) / 3);
  }
}

@media (max-width: 1023px) {
  .similar-properties__scroller {
    grid-auto-columns: calc((100% - 14px) / 2);
  }
}

@media (max-width: 640px) {
  .similar-properties {
    padding: 18px 14px;
    border-radius: 0;
    border-right: 0;
    border-left: 0;
  }

  .similar-properties > header {
    align-items: flex-start;
  }

  .similar-properties__header-actions button {
    display: none;
  }

  .similar-properties__scroller {
    grid-auto-columns: 84%;
  }

  .similar-properties__empty {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .similar-properties__empty a {
    grid-column: 1 / -1;
    min-height: 42px;
    border-radius: 10px;
    background: rgb(239 246 255);
    text-align: center;
    line-height: 42px;
  }

  .similar-quick-view {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .similar-quick-view > img,
  .similar-quick-view__placeholder {
    min-height: 220px;
    max-height: 34dvh;
  }

  .similar-quick-view__content {
    padding: 22px 18px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .similar-properties__scroller,
  .similar-properties__scroller > article,
  .similar-property-card__media > img,
  .similar-quick-view-enter-active,
  .similar-quick-view-leave-active {
    scroll-behavior: auto;
    transition: none;
  }

  .similar-properties__scroller > article:hover,
  article:hover .similar-property-card__media > img {
    transform: none;
  }
}
</style>
