<template>
  <aside class="property-booking-panel" aria-label="Property booking and pricing">
    <section class="property-booking-card is-primary">
      <div class="property-booking-card__topline">
        <span :class="{ 'is-unavailable': !property.isAvailable }">
          {{ property.isAvailable ? 'Available' : 'Unavailable' }}
        </span>
        <button
          type="button"
          class="property-booking-card__compare"
          :aria-pressed="isCompared"
          :disabled="compareDisabled && !isCompared"
          @click="$emit('toggle-compare')"
        >
          <IonIcon :icon="gitCompareOutline" aria-hidden="true" />
          {{ isCompared ? 'Added to compare' : 'Add to compare' }}
        </button>
      </div>

      <div class="property-booking-card__price">
        <strong>{{ formatCurrency(property.rentPrice) }}</strong>
        <span>/ {{ formatPeriod(property.paymentDuration) }}</span>
      </div>

      <dl v-if="feeItems.length" class="property-booking-card__fees">
        <div v-for="fee in feeItems" :key="fee.label">
          <dt>{{ fee.label }}</dt>
          <dd>{{ formatCurrency(fee.value) }}</dd>
        </div>
      </dl>

      <RouterLink :to="`/booking/${property.id}`" class="property-booking-button is-primary">
        <IonIcon :icon="calendarOutline" aria-hidden="true" />
        Book inspection
      </RouterLink>

      <RouterLink
        v-if="property.inspectionFee > 0"
        :to="`/payment/${property.id}?type=inspection_fee`"
        class="property-booking-button is-secondary"
      >
        <IonIcon :icon="cardOutline" aria-hidden="true" />
        Pay inspection fee
      </RouterLink>

      <p class="property-booking-card__note">
        <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />
        Review the listing and schedule an inspection before completing rent payment.
      </p>
    </section>

    <section class="property-booking-card">
      <h2>Quick actions</h2>
      <div class="property-action-dock" aria-label="Property quick actions">
        <button
          type="button"
          :title="isSaved ? 'Remove from saved properties' : 'Save property'"
          :aria-label="isSaved ? 'Remove from saved properties' : 'Save property'"
          :aria-pressed="isSaved"
          :disabled="isSaving"
          @click="$emit('toggle-saved')"
        >
          <IonSpinner v-if="isSaving" name="crescent" aria-hidden="true" />
          <IonIcon v-else :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
        </button>
        <a
          v-if="contactLinks.whatsapp"
          :href="contactLinks.whatsapp"
          target="_blank"
          rel="noreferrer"
          title="Chat on WhatsApp"
          aria-label="Chat with the property contact on WhatsApp"
        >
          <IonIcon :icon="logoWhatsapp" aria-hidden="true" />
        </a>
        <a
          v-if="contactLinks.call"
          :href="contactLinks.call"
          title="Call property contact"
          aria-label="Call the property contact"
        >
          <IonIcon :icon="callOutline" aria-hidden="true" />
        </a>
        <a
          v-if="directionsUrl"
          :href="directionsUrl"
          target="_blank"
          rel="noreferrer"
          title="Get directions"
          aria-label="Open directions to this property"
        >
          <IonIcon :icon="navigateOutline" aria-hidden="true" />
        </a>
        <button
          type="button"
          title="Share listing"
          aria-label="Share this property listing"
          @click="$emit('share')"
        >
          <IonIcon :icon="shareSocialOutline" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        class="property-booking-button is-save"
        :disabled="isSaving"
        @click="$emit('toggle-saved')"
      >
        <IonSpinner v-if="isSaving" name="crescent" aria-hidden="true" />
        <IonIcon v-else :icon="isSaved ? heart : heartOutline" aria-hidden="true" />
        {{ isSaved ? 'Remove from saved' : 'Save property' }}
      </button>

      <a
        v-if="contactLinks.call"
        :href="contactLinks.call"
        class="property-booking-button is-quiet"
      >
        <IonIcon :icon="callOutline" aria-hidden="true" />
        Call {{ contactRoleLabel }}
      </a>
      <a
        v-if="contactLinks.whatsapp"
        :href="contactLinks.whatsapp"
        target="_blank"
        rel="noreferrer"
        class="property-booking-button is-whatsapp"
      >
        <IonIcon :icon="logoWhatsapp" aria-hidden="true" />
        Chat on WhatsApp
      </a>
      <RouterLink
        v-if="canEdit"
        :to="`/edit-property/${property.id}`"
        class="property-booking-button is-quiet"
      >
        <IonIcon :icon="createOutline" aria-hidden="true" />
        Edit property
      </RouterLink>

      <p
        v-if="actionMessage"
        class="property-booking-card__message"
        :class="`is-${messageTone}`"
        role="status"
        aria-live="polite"
      >
        {{ actionMessage }}
      </p>
    </section>

    <section v-if="ownerProfile || property.ownerPhone" class="property-booking-card">
      <h2>Contact overview</h2>
      <div class="property-contact">
        <img
          v-if="ownerProfile?.photoURL"
          :src="ownerProfile.photoURL"
          :alt="ownerProfile.fullName || contactRoleLabel"
          referrerpolicy="no-referrer"
        />
        <span v-else class="property-contact__avatar" aria-hidden="true">
          {{ contactInitial }}
        </span>
        <div>
          <strong>{{ ownerProfile?.fullName || contactRoleLabel }}</strong>
          <span v-if="ownerProfile?.isVerifiedAgent" class="property-contact__verified">
            <IonIcon :icon="checkmarkCircle" aria-hidden="true" />
            Verified
          </span>
          <small>{{ contactRoleLabel }}</small>
        </div>
      </div>
      <dl class="property-contact__details">
        <div v-if="property.ownerPhone">
          <IonIcon :icon="callOutline" aria-hidden="true" />
          <dt>Phone</dt>
          <dd>{{ property.ownerPhone }}</dd>
        </div>
        <div v-if="ownerProfile?.email">
          <IonIcon :icon="mailOutline" aria-hidden="true" />
          <dt>Email</dt>
          <dd>{{ ownerProfile.email }}</dd>
        </div>
        <div v-if="property.city || property.state">
          <IonIcon :icon="locationOutline" aria-hidden="true" />
          <dt>Location</dt>
          <dd>{{ [property.city, property.state].filter(Boolean).join(', ') }}</dd>
        </div>
      </dl>
    </section>

    <section class="property-booking-card">
      <h2>Payment options</h2>
      <div class="property-booking-card__payment-actions">
        <RouterLink v-if="serviceFeeTotal > 0" :to="`/payment/${property.id}?type=service_fee`">
          Pay service fees
          <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
        </RouterLink>
        <RouterLink
          v-if="property.rentPrice > 0"
          :to="`/payment/${property.id}?type=full_rent_payment`"
        >
          Pay full rent
          <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
        </RouterLink>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { IonIcon, IonSpinner } from '@ionic/vue'
import {
  arrowForwardOutline,
  calendarOutline,
  callOutline,
  cardOutline,
  checkmarkCircle,
  createOutline,
  gitCompareOutline,
  heart,
  heartOutline,
  locationOutline,
  logoWhatsapp,
  mailOutline,
  navigateOutline,
  shareSocialOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { buildPropertyContactLinks, type PropertyRecord } from '../../../types/property'
import type { UserProfile } from '../../../types/user'

const props = defineProps<{
  property: PropertyRecord
  ownerProfile: UserProfile | null
  isSaved: boolean
  isSaving: boolean
  canEdit: boolean
  actionMessage: string
  messageTone: 'success' | 'error' | 'info'
  directionsUrl: string
  isCompared: boolean
  compareDisabled: boolean
}>()

defineEmits<{
  'toggle-saved': []
  'toggle-compare': []
  share: []
}>()

const contactLinks = computed(() => buildPropertyContactLinks(props.property.ownerPhone))
const contactRoleLabel = computed(() => {
  const labels: Record<PropertyRecord['ownerRole'], string> = {
    user: 'Listing contact',
    tenant: 'Listing contact',
    landlord: 'Listing contact',
    agent: 'Listing contact',
    admin: 'Listing contact',
  }

  return labels[props.property.ownerRole]
})
const contactInitial = computed(() =>
  (props.ownerProfile?.fullName || contactRoleLabel.value).charAt(0).toUpperCase()
)
const serviceFeeTotal = computed(() => props.property.cautionFee + props.property.agencyFee)
const feeItems = computed(() =>
  [
    props.property.inspectionFee > 0
      ? { label: 'Inspection fee', value: props.property.inspectionFee }
      : null,
    props.property.agencyFee > 0 ? { label: 'Agency fee', value: props.property.agencyFee } : null,
    props.property.cautionFee > 0
      ? { label: 'Caution fee', value: props.property.cautionFee }
      : null,
  ].filter((item): item is { label: string; value: number } => Boolean(item))
)

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
.property-booking-panel {
  display: grid;
  gap: 14px;
}

.property-booking-card {
  padding: 18px;
  border: 1px solid rgb(226 232 240);
  border-radius: 16px;
  background: rgb(255 255 255 / 0.96);
  box-shadow: 0 14px 34px -30px rgb(15 23 42 / 0.5);
}

.property-booking-card h2 {
  color: rgb(15 23 42);
  font-size: 14px;
  font-weight: 800;
}

.property-booking-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.property-booking-card__topline > span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  border-radius: 999px;
  background: rgb(236 253 245);
  padding: 0 10px;
  color: rgb(5 150 105);
  font-size: 11px;
  font-weight: 800;
}

.property-booking-card__topline > span.is-unavailable {
  background: rgb(255 251 235);
  color: rgb(180 83 9);
}

.property-booking-card__compare {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 6px;
  border-radius: 9px;
  padding: 0 8px;
  color: rgb(37 99 235);
  font-size: 10px;
  font-weight: 800;
  transition: background 200ms ease;
}

.property-booking-card__compare:hover {
  background: rgb(239 246 255);
}

.property-booking-card__compare:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.property-booking-card__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 16px;
}

.property-booking-card__price strong {
  color: rgb(15 23 42);
  font-size: clamp(24px, 2.2vw, 30px);
  font-weight: 850;
}

.property-booking-card__price span {
  color: rgb(100 116 139);
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.property-booking-card__fees {
  display: grid;
  gap: 9px;
  margin: 16px 0;
  padding: 13px 0;
  border-block: 1px solid rgb(241 245 249);
}

.property-booking-card__fees div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: rgb(100 116 139);
  font-size: 11px;
}

.property-booking-card__fees dd {
  color: rgb(15 23 42);
  font-weight: 800;
}

.property-booking-button {
  display: inline-flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 9px;
  border: 1px solid rgb(203 213 225);
  border-radius: 11px;
  padding: 0 14px;
  color: rgb(15 23 42);
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  transition:
    background 200ms ease,
    border-color 200ms ease,
    transform 200ms ease;
}

.property-booking-button:hover {
  transform: translateY(-1px);
}

.property-booking-button.is-primary {
  border-color: rgb(37 99 235);
  background: rgb(37 99 235);
  color: white;
}

.property-booking-button.is-primary:hover {
  background: rgb(29 78 216);
}

.property-booking-button.is-secondary {
  border-color: rgb(191 219 254);
  background: rgb(239 246 255);
  color: rgb(29 78 216);
}

.property-booking-button.is-save {
  border-color: rgb(15 23 42);
  background: rgb(15 23 42);
  color: white;
}

.property-booking-button.is-whatsapp {
  border-color: rgb(167 243 208);
  background: rgb(236 253 245);
  color: rgb(5 150 105);
}

.property-booking-button:disabled {
  cursor: wait;
  opacity: 0.66;
}

.property-booking-card__note {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  color: rgb(100 116 139);
  font-size: 10px;
  line-height: 1.55;
}

.property-booking-card__note ion-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: rgb(37 99 235);
  font-size: 15px;
}

.property-action-dock {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin: 13px 0;
}

.property-action-dock button,
.property-action-dock a {
  display: grid;
  min-width: 0;
  height: 42px;
  place-items: center;
  border: 1px solid rgb(226 232 240);
  border-radius: 10px;
  background: rgb(248 250 252);
  color: rgb(51 65 85);
  font-size: 17px;
  transition:
    border-color 200ms ease,
    color 200ms ease,
    transform 200ms ease;
}

.property-action-dock button:hover,
.property-action-dock a:hover {
  border-color: rgb(147 197 253);
  color: rgb(37 99 235);
  transform: translateY(-1px);
}

.property-booking-card__message {
  margin-top: 12px;
  border: 1px solid rgb(191 219 254);
  border-radius: 10px;
  background: rgb(239 246 255);
  padding: 10px 12px;
  color: rgb(29 78 216);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.5;
}

.property-booking-card__message.is-success {
  border-color: rgb(167 243 208);
  background: rgb(236 253 245);
  color: rgb(5 150 105);
}

.property-booking-card__message.is-error {
  border-color: rgb(254 205 211);
  background: rgb(255 241 242);
  color: rgb(225 29 72);
}

.property-contact {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 14px;
}

.property-contact img,
.property-contact__avatar {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: rgb(219 234 254);
  color: rgb(37 99 235);
  font-size: 17px;
  font-weight: 850;
  object-fit: cover;
}

.property-contact > div {
  min-width: 0;
}

.property-contact strong {
  display: inline;
  color: rgb(15 23 42);
  font-size: 12px;
}

.property-contact small {
  display: block;
  margin-top: 3px;
  color: rgb(100 116 139);
  font-size: 10px;
  text-transform: capitalize;
}

.property-contact__verified {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 6px;
  color: rgb(5 150 105);
  font-size: 9px;
  font-weight: 800;
}

.property-contact__details {
  display: grid;
  gap: 10px;
  margin-top: 15px;
}

.property-contact__details div {
  display: grid;
  min-width: 0;
  grid-template-columns: 18px minmax(58px, auto) minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  font-size: 10px;
}

.property-contact__details ion-icon {
  color: rgb(37 99 235);
  font-size: 14px;
}

.property-contact__details dt {
  color: rgb(100 116 139);
}

.property-contact__details dd {
  overflow: hidden;
  color: rgb(51 65 85);
  font-weight: 700;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-booking-card__payment-actions {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.property-booking-card__payment-actions a {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 9px;
  background: rgb(248 250 252);
  padding: 0 11px;
  color: rgb(37 99 235);
  font-size: 11px;
  font-weight: 800;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

:global(.dark) .property-booking-card {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42 / 0.96);
}

:global(.dark) .property-booking-card h2,
:global(.dark) .property-booking-card__price strong,
:global(.dark) .property-booking-card__fees dd,
:global(.dark) .property-contact strong {
  color: white;
}

:global(.dark) .property-action-dock button,
:global(.dark) .property-action-dock a,
:global(.dark) .property-booking-card__payment-actions a {
  border-color: rgb(51 65 85);
  background: rgb(30 41 59);
}

:global(.dark) .property-contact__details dd {
  color: rgb(226 232 240);
}

@media (prefers-reduced-motion: reduce) {
  .property-booking-button,
  .property-action-dock button,
  .property-action-dock a,
  .property-booking-card__compare {
    transition: none;
  }

  .property-booking-button:hover,
  .property-action-dock button:hover,
  .property-action-dock a:hover {
    transform: none;
  }
}
</style>
