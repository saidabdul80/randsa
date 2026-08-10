<template>
  <article class="marketplace-preview">
    <figure>
      <img v-if="coverImage" :src="coverImage" :alt="value.title || 'Listing preview'" />
      <span v-else><IonIcon :icon="imagesOutline" aria-hidden="true" /> Add a cover image</span>
      <div>
        <b>{{ value.subcategoryName }}</b
        ><b>Pending review</b>
      </div>
    </figure>
    <section>
      <p>{{ value.categoryName }}</p>
      <h3>{{ value.title.trim() || 'Your listing title' }}</h3>
      <span><IonIcon :icon="locationOutline" aria-hidden="true" /> {{ locationLabel }}</span>
      <strong
        >{{ priceLabel }}
        <small v-if="value.pricing.billingPeriod"
          >/ {{ value.pricing.billingPeriod }}</small
        ></strong
      >
    </section>
  </article>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { imagesOutline, locationOutline } from 'ionicons/icons'
import { computed } from 'vue'
import type { ListingFormInput } from '../../types/listing'

const props = defineProps<{ value: ListingFormInput }>()
const coverImage = computed(() => props.value.images[0]?.previewUrl ?? '')
const locationLabel = computed(
  () =>
    [props.value.location.area, props.value.location.city, props.value.location.state]
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part, index, parts) => parts.indexOf(part) === index)
      .join(', ') || 'Add a location'
)
const priceLabel = computed(() => {
  if (props.value.pricing.priceType === 'free') return 'Free'
  if (props.value.pricing.priceType === 'contact') return 'Contact for price'
  if (!props.value.pricing.amount) return 'Add pricing'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: props.value.pricing.currency,
    maximumFractionDigits: 0,
  }).format(props.value.pricing.amount)
})
</script>

<style scoped>
.marketplace-preview {
  overflow: hidden;
  border: 1px solid #dfe7f0;
  border-radius: 14px;
  background: #fff;
}
.marketplace-preview figure {
  position: relative;
  display: grid;
  height: 240px;
  margin: 0;
  place-items: center;
  background: #edf3fa;
  color: #718399;
}
.marketplace-preview figure img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.marketplace-preview figure > span {
  display: grid;
  gap: 6px;
  place-items: center;
  font-size: 11px;
  font-weight: 750;
}
.marketplace-preview figure > span ion-icon {
  font-size: 28px;
}
.marketplace-preview figure div {
  position: absolute;
  inset: 10px 10px auto;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.marketplace-preview figure b {
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 8px;
  color: #31506f;
  font-size: 8px;
  backdrop-filter: blur(8px);
}
.marketplace-preview section {
  display: grid;
  gap: 6px;
  padding: 16px;
}
.marketplace-preview p,
.marketplace-preview h3 {
  margin: 0;
}
.marketplace-preview p {
  color: #1769ef;
  font-size: 8px;
  font-weight: 850;
  text-transform: uppercase;
}
.marketplace-preview h3 {
  color: #102033;
  font-size: 18px;
}
.marketplace-preview section > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #6a7c91;
  font-size: 10px;
}
.marketplace-preview section > strong {
  margin-top: 5px;
  color: #079455;
  font-size: 17px;
}
.marketplace-preview section > strong small {
  color: #718399;
  font-size: 10px;
  font-weight: 650;
}
:global(.dark) .marketplace-preview {
  border-color: #2a394b;
  background: #111c2a;
}
:global(.dark) .marketplace-preview h3 {
  color: #f8fafc;
}
</style>
