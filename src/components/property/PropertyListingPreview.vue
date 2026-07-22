<template>
  <aside class="listing-preview" aria-label="Live listing preview">
    <header class="listing-preview__header">
      <div>
        <span>Live preview</span>
        <h2>Customer listing card</h2>
      </div>
      <div class="listing-preview__score" :class="scoreTone">
        <strong>{{ quality.score }}%</strong>
        <small>quality</small>
      </div>
    </header>

    <div class="listing-preview__progress" aria-hidden="true">
      <span :style="{ width: `${quality.score}%` }" />
    </div>

    <article class="listing-preview__card">
      <figure>
        <img v-if="coverImage" :src="coverImage" :alt="value.title || 'Listing cover preview'">
        <div v-else class="listing-preview__empty-image">
          <IonIcon :icon="imagesOutline" aria-hidden="true" />
          <span>Add a cover image</span>
        </div>
        <div class="listing-preview__badges">
          <span>{{ config.shortLabel }}</span>
          <span :class="value.isAvailable ? 'is-available' : 'is-unavailable'">
            {{ value.isAvailable ? 'Available' : 'Unavailable' }}
          </span>
        </div>
      </figure>

      <div class="listing-preview__body">
        <h3>{{ value.title.trim() || 'Add a listing title' }}</h3>
        <p class="listing-preview__location">
          <IonIcon :icon="locationOutline" aria-hidden="true" />
          {{ locationLabel || 'Complete the listing location' }}
        </p>

        <div v-if="detailItems.length" class="listing-preview__details">
          <span v-for="detail in detailItems" :key="detail">{{ detail }}</span>
        </div>

        <div v-if="value.amenities.length" class="listing-preview__amenities">
          <span v-for="amenity in value.amenities.slice(0, 4)" :key="amenity">{{ amenity }}</span>
          <span v-if="value.amenities.length > 4">+{{ value.amenities.length - 4 }}</span>
        </div>

        <div class="listing-preview__footer">
          <div>
            <strong>{{ priceLabel }}</strong>
            <small v-if="value.rentPrice > 0">/ {{ paymentUnit }}</small>
          </div>
          <span>
            <IonIcon :icon="imagesOutline" aria-hidden="true" />
            {{ value.images.length }}
          </span>
        </div>
      </div>
    </article>

    <section class="listing-preview__quality" aria-labelledby="listing-quality-title">
      <div class="listing-preview__quality-title">
        <IonIcon :icon="sparklesOutline" aria-hidden="true" />
        <h3 id="listing-quality-title">Listing quality</h3>
      </div>
      <ul>
        <li v-for="check in quality.checks" :key="check.id" :class="{ complete: check.complete }">
          <IonIcon :icon="check.complete ? checkmarkCircle : ellipseOutline" aria-hidden="true" />
          <span>{{ check.label }}</span>
        </li>
      </ul>
      <p v-if="nextSuggestion">
        <strong>Next improvement:</strong> {{ nextSuggestion }}
      </p>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  checkmarkCircle,
  ellipseOutline,
  imagesOutline,
  locationOutline,
  sparklesOutline,
} from 'ionicons/icons'
import { computed } from 'vue'

import { resolveListingFormConfig } from '../../config/listingFormConfig'
import type { PropertyFormInput } from '../../types/property'
import { resolveListingQuality } from '../../utils/listingQuality'

const props = defineProps<{
  value: PropertyFormInput
}>()

const config = computed(() => resolveListingFormConfig(props.value.category, props.value.propertyType))
const quality = computed(() => resolveListingQuality(props.value))
const coverImage = computed(() => props.value.images[0]?.previewUrl ?? '')
const locationLabel = computed(() => {
  const parts = [props.value.area, props.value.city, props.value.state]
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.filter((part, index) => parts.indexOf(part) === index).join(', ')
})
const priceLabel = computed(() => {
  if (props.value.rentPrice <= 0) return 'Add pricing'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(props.value.rentPrice)
})
const paymentUnit = computed(() => props.value.paymentDuration.replaceAll('_', ' '))
const scoreTone = computed(() => {
  if (quality.value.score >= 80) return 'is-strong'
  if (quality.value.score >= 50) return 'is-progressing'
  return 'is-starting'
})
const nextSuggestion = computed(
  () => quality.value.missingRequired[0] ?? quality.value.suggestions[0] ?? '',
)
const detailItems = computed(() => {
  if (config.value.detailMode === 'residential') {
    return [
      props.value.bedrooms === null ? '' : `${props.value.bedrooms} bed`,
      props.value.bathrooms === null ? '' : `${props.value.bathrooms} bath`,
      props.value.toilets === null ? '' : `${props.value.toilets} toilet`,
    ].filter(Boolean)
  }

  if (config.value.detailMode === 'commercial') {
    return [props.value.shopSize.trim(), props.value.parking ? 'Parking' : '', props.value.security ? 'Security' : '']
      .filter(Boolean)
  }

  return []
})
</script>

<style scoped>
.listing-preview {
  display: grid;
  gap: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 22px 55px -42px rgba(16, 32, 51, 0.48);
}

.listing-preview__header,
.listing-preview__footer,
.listing-preview__quality-title {
  display: flex;
  align-items: center;
}

.listing-preview__header { justify-content: space-between; gap: 14px; }
.listing-preview__header span { color: #2563db; font-size: 10px; font-weight: 850; letter-spacing: 0.12em; text-transform: uppercase; }
.listing-preview__header h2 { margin: 4px 0 0; color: #102033; font-size: 16px; font-weight: 850; }

.listing-preview__score {
  display: grid;
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  place-content: center;
  border-radius: 50%;
  background: #eff6ff;
  color: #1d4ed8;
  text-align: center;
}

.listing-preview__score strong { font-size: 15px; line-height: 1; }
.listing-preview__score small { margin-top: 3px; font-size: 7px; font-weight: 750; }
.listing-preview__score.is-strong { background: #ecfdf3; color: #15803d; }
.listing-preview__score.is-progressing { background: #fffbeb; color: #b45309; }

.listing-preview__progress { height: 5px; overflow: hidden; border-radius: 3px; background: #edf2f7; }
.listing-preview__progress span { display: block; height: 100%; border-radius: inherit; background: #246be8; transition: width 210ms ease; }

.listing-preview__card { overflow: hidden; border: 1px solid #e2e8f0; border-radius: 15px; background: #ffffff; }
.listing-preview__card figure { position: relative; height: 174px; margin: 0; background: #edf3fa; }
.listing-preview__card figure > img { width: 100%; height: 100%; object-fit: cover; }
.listing-preview__empty-image { display: grid; width: 100%; height: 100%; place-content: center; gap: 7px; color: #7b8ba1; text-align: center; }
.listing-preview__empty-image ion-icon { margin: auto; font-size: 28px; }
.listing-preview__empty-image span { font-size: 11px; font-weight: 750; }

.listing-preview__badges { position: absolute; top: 11px; left: 11px; display: flex; gap: 6px; }
.listing-preview__badges span { border-radius: 10px; background: rgba(255,255,255,.9); padding: 5px 8px; color: #31506f; font-size: 9px; font-weight: 850; backdrop-filter: blur(9px); }
.listing-preview__badges .is-available { color: #07834d; }
.listing-preview__badges .is-unavailable { color: #b45309; }

.listing-preview__body { padding: 15px; }
.listing-preview__body h3 { overflow: hidden; margin: 0; color: #102033; font-size: 16px; font-weight: 850; text-overflow: ellipsis; white-space: nowrap; }
.listing-preview__location { display: flex; align-items: center; gap: 5px; overflow: hidden; margin: 6px 0 0; color: #6b7a90; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.listing-preview__location ion-icon { flex: 0 0 auto; font-size: 12px; }
.listing-preview__details,
.listing-preview__amenities { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
.listing-preview__details span,
.listing-preview__amenities span { border-radius: 9px; background: #f1f5f9; padding: 5px 7px; color: #53657b; font-size: 10px; font-weight: 700; }
.listing-preview__footer { justify-content: space-between; gap: 12px; margin-top: 14px; }
.listing-preview__footer strong { color: #079455; font-size: 15px; }
.listing-preview__footer small { margin-left: 3px; color: #7b8ba1; font-size: 10px; }
.listing-preview__footer > span { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 10px; font-weight: 750; }

.listing-preview__quality { border-top: 1px solid #e7edf4; padding-top: 14px; }
.listing-preview__quality-title { gap: 7px; color: #1d63d4; }
.listing-preview__quality-title ion-icon { font-size: 17px; }
.listing-preview__quality-title h3 { margin: 0; color: #102033; font-size: 13px; }
.listing-preview__quality ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px 10px; margin: 12px 0 0; padding: 0; list-style: none; }
.listing-preview__quality li { display: flex; min-width: 0; align-items: center; gap: 6px; color: #8794a5; font-size: 9px; font-weight: 700; }
.listing-preview__quality li ion-icon { flex: 0 0 auto; color: #b6c0cc; font-size: 13px; }
.listing-preview__quality li.complete { color: #38536f; }
.listing-preview__quality li.complete ion-icon { color: #16a364; }
.listing-preview__quality > p { margin: 12px 0 0; border-radius: 10px; background: #f6f9fc; padding: 9px 10px; color: #617389; font-size: 9px; line-height: 1.55; }

@media (prefers-reduced-motion: reduce) {
  .listing-preview__progress span { transition: none; }
}

:global(.dark) .listing-preview,
:global(.dark) .listing-preview__card { border-color: #29374a; background: #111c2a; }
:global(.dark) .listing-preview__header h2,
:global(.dark) .listing-preview__body h3,
:global(.dark) .listing-preview__quality-title h3 { color: #f8fafc; }
:global(.dark) .listing-preview__progress,
:global(.dark) .listing-preview__details span,
:global(.dark) .listing-preview__amenities span,
:global(.dark) .listing-preview__quality > p { background: #182638; color: #bac7d6; }
:global(.dark) .listing-preview__quality { border-color: #29374a; }
:global(.dark) .listing-preview__quality li.complete { color: #c6d3e1; }
</style>
