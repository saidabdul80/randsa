<template>
  <Teleport to="body">
    <Transition name="property-sheet">
      <div
        v-if="open"
        class="property-sheet-backdrop"
        role="presentation"
        @mousedown.self="$emit('close')"
      >
        <section
          ref="dialogRef"
          class="property-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="property-sheet-title"
          tabindex="-1"
          @keydown="handleKeydown"
          @pointerdown="handlePointerDown"
          @pointerup="handlePointerUp"
        >
          <span class="property-sheet__handle" aria-hidden="true" />
          <header>
            <div>
              <p>Property actions</p>
              <h2 id="property-sheet-title">{{ property.title }}</h2>
            </div>
            <button type="button" aria-label="Close property actions" @click="$emit('close')">
              <IonIcon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <div class="property-sheet__price">
            <strong>{{ formatCurrency(property.rentPrice) }}</strong>
            <span>/ {{ formatPeriod(property.paymentDuration) }}</span>
          </div>

          <div class="property-sheet__actions">
            <RouterLink :to="`/booking/${property.id}`" class="is-primary">
              <IonIcon :icon="calendarOutline" aria-hidden="true" />
              <span>Book inspection</span>
              <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
            </RouterLink>
            <RouterLink
              v-if="property.inspectionFee > 0"
              :to="`/payment/${property.id}?type=inspection_fee`"
            >
              <IonIcon :icon="cardOutline" aria-hidden="true" />
              <span>Pay inspection fee</span>
              <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
            </RouterLink>
            <RouterLink
              v-if="property.rentPrice > 0"
              :to="`/payment/${property.id}?type=full_rent_payment`"
            >
              <IonIcon :icon="walletOutline" aria-hidden="true" />
              <span>Pay full rent</span>
              <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
            </RouterLink>
            <button type="button" :disabled="isSaving" @click="$emit('toggle-saved')">
              <IonSpinner v-if="isSaving" name="crescent" aria-hidden="true" />
              <IonIcon v-else :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
              <span>{{ isSaved ? 'Remove from saved' : 'Save property' }}</span>
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </button>
            <a
              v-if="contactLinks.whatsapp"
              :href="contactLinks.whatsapp"
              target="_blank"
              rel="noreferrer"
            >
              <IonIcon :icon="logoWhatsapp" aria-hidden="true" />
              <span>Chat on WhatsApp</span>
              <IonIcon :icon="openOutline" aria-hidden="true" />
            </a>
            <a v-if="contactLinks.call" :href="contactLinks.call">
              <IonIcon :icon="callOutline" aria-hidden="true" />
              <span>Call property contact</span>
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </a>
            <a v-if="directionsUrl" :href="directionsUrl" target="_blank" rel="noreferrer">
              <IonIcon :icon="navigateOutline" aria-hidden="true" />
              <span>Get directions</span>
              <IonIcon :icon="openOutline" aria-hidden="true" />
            </a>
            <button type="button" @click="$emit('share')">
              <IonIcon :icon="shareSocialOutline" aria-hidden="true" />
              <span>Share listing</span>
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </button>
            <button
              type="button"
              :disabled="compareDisabled && !isCompared"
              @click="$emit('toggle-compare')"
            >
              <IonIcon :icon="gitCompareOutline" aria-hidden="true" />
              <span>{{ isCompared ? 'Remove from comparison' : 'Add to comparison' }}</span>
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </button>
            <button v-if="comparisonCount > 0" type="button" @click="$emit('open-comparison')">
              <IonIcon :icon="albumsOutline" aria-hidden="true" />
              <span>Compare selected ({{ comparisonCount }})</span>
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </button>
            <RouterLink v-if="canEdit" :to="`/edit-property/${property.id}`">
              <IonIcon :icon="createOutline" aria-hidden="true" />
              <span>Edit property</span>
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </RouterLink>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  albumsOutline,
  arrowForwardOutline,
  calendarOutline,
  callOutline,
  cardOutline,
  chevronForwardOutline,
  closeOutline,
  createOutline,
  gitCompareOutline,
  heart,
  heartOutline,
  logoWhatsapp,
  navigateOutline,
  openOutline,
  shareSocialOutline,
  walletOutline,
} from 'ionicons/icons'
import { computed, ref, toRef } from 'vue'
import { RouterLink } from 'vue-router'

import { useModalDialog } from '../../../composables/useModalDialog'
import { buildPropertyContactLinks, type PropertyRecord } from '../../../types/property'

const props = defineProps<{
  open: boolean
  property: PropertyRecord
  isSaved: boolean
  isSaving: boolean
  canEdit: boolean
  directionsUrl: string
  isCompared: boolean
  compareDisabled: boolean
  comparisonCount: number
}>()

const emit = defineEmits<{
  close: []
  'toggle-saved': []
  'toggle-compare': []
  'open-comparison': []
  share: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const pointerStartY = ref<number | null>(null)
const contactLinks = computed(() => buildPropertyContactLinks(props.property.ownerPhone))
const { handleKeydown } = useModalDialog(toRef(props, 'open'), dialogRef, () => emit('close'))

function handlePointerDown(event: PointerEvent) {
  pointerStartY.value = event.clientY
}

function handlePointerUp(event: PointerEvent) {
  if (pointerStartY.value === null) return

  const verticalDistance = event.clientY - pointerStartY.value
  pointerStartY.value = null

  if (verticalDistance > 90) emit('close')
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
.property-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgb(15 23 42 / 0.48);
  backdrop-filter: blur(5px);
}

.property-sheet {
  width: min(620px, 100%);
  max-height: min(82dvh, 760px);
  overflow-y: auto;
  border: 1px solid rgb(226 232 240);
  border-radius: 22px 22px 0 0;
  background: white;
  padding: 10px 18px calc(20px + env(safe-area-inset-bottom));
  box-shadow: 0 -24px 60px -30px rgb(15 23 42 / 0.55);
  outline: none;
}

.property-sheet__handle {
  display: block;
  width: 42px;
  height: 4px;
  margin: 2px auto 13px;
  border-radius: 999px;
  background: rgb(203 213 225);
}

.property-sheet header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.property-sheet header p {
  color: rgb(37 99 235);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.property-sheet header h2 {
  max-width: 70vw;
  overflow: hidden;
  margin-top: 3px;
  color: rgb(15 23 42);
  font-size: 17px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-sheet header button {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(226 232 240);
  border-radius: 50%;
  color: rgb(51 65 85);
  font-size: 19px;
}

.property-sheet__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 16px 0 12px;
  padding: 13px 14px;
  border-radius: 13px;
  background: rgb(248 250 252);
}

.property-sheet__price strong {
  color: rgb(15 23 42);
  font-size: 21px;
  font-weight: 850;
}

.property-sheet__price span {
  color: rgb(100 116 139);
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.property-sheet__actions {
  display: grid;
  gap: 7px;
}

.property-sheet__actions > a,
.property-sheet__actions > button {
  display: grid;
  min-height: 48px;
  grid-template-columns: 24px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 10px;
  border: 1px solid rgb(226 232 240);
  border-radius: 12px;
  padding: 0 13px;
  color: rgb(51 65 85);
  font-size: 12px;
  font-weight: 750;
  text-align: left;
}

.property-sheet__actions > a > ion-icon:first-child,
.property-sheet__actions > button > ion-icon:first-child {
  color: rgb(37 99 235);
  font-size: 18px;
}

.property-sheet__actions > a > ion-icon:last-child,
.property-sheet__actions > button > ion-icon:last-child {
  color: rgb(148 163 184);
}

.property-sheet__actions > .is-primary {
  border-color: rgb(37 99 235);
  background: rgb(37 99 235);
  color: white;
}

.property-sheet__actions > .is-primary ion-icon {
  color: white;
}

.property-sheet__actions > button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

.property-sheet-enter-active,
.property-sheet-leave-active {
  transition: opacity 200ms ease;
}

.property-sheet-enter-active .property-sheet,
.property-sheet-leave-active .property-sheet {
  transition: transform 200ms ease;
}

.property-sheet-enter-from,
.property-sheet-leave-to {
  opacity: 0;
}

.property-sheet-enter-from .property-sheet,
.property-sheet-leave-to .property-sheet {
  transform: translateY(100%);
}

:global(.dark) .property-sheet {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
}

:global(.dark) .property-sheet header h2,
:global(.dark) .property-sheet__price strong {
  color: white;
}

:global(.dark) .property-sheet__price,
:global(.dark) .property-sheet__actions > a,
:global(.dark) .property-sheet__actions > button {
  border-color: rgb(51 65 85);
  background: rgb(30 41 59);
  color: rgb(226 232 240);
}

@media (min-width: 1024px) {
  .property-sheet-backdrop {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .property-sheet-enter-active,
  .property-sheet-leave-active,
  .property-sheet-enter-active .property-sheet,
  .property-sheet-leave-active .property-sheet {
    transition: none;
  }
}
</style>
