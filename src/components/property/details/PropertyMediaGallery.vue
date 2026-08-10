<template>
  <section
    class="property-gallery"
    aria-label="Property photo gallery"
    tabindex="0"
    @keydown.left.prevent="selectPrevious"
    @keydown.right.prevent="selectNext"
  >
    <div v-if="normalizedImages.length" class="property-gallery__desktop">
      <button
        type="button"
        class="property-gallery__hero"
        :class="{ 'is-single': normalizedImages.length === 1 }"
        :aria-label="`Open photo 1 of ${normalizedImages.length}`"
        @click="openLightbox(0)"
      >
        <span v-if="!loadedImages.has(normalizedImages[0])" class="property-gallery__skeleton" />
        <img
          :src="normalizedImages[0]"
          :alt="`${title} main property photo`"
          fetchpriority="high"
          decoding="async"
          @load="markLoaded(normalizedImages[0])"
        />
      </button>

      <div
        v-if="normalizedImages.length > 1"
        class="property-gallery__previews"
        :class="`has-${Math.min(normalizedImages.length - 1, 4)}`"
      >
        <button
          v-for="(image, previewIndex) in previewImages"
          :key="`${image}-${previewIndex}`"
          type="button"
          :aria-label="`Open photo ${previewIndex + 2} of ${normalizedImages.length}`"
          @click="openLightbox(previewIndex + 1)"
        >
          <span v-if="!loadedImages.has(image)" class="property-gallery__skeleton" />
          <img
            :src="image"
            :alt="`${title} property photo ${previewIndex + 2}`"
            loading="lazy"
            decoding="async"
            @load="markLoaded(image)"
          />
          <span
            v-if="previewIndex === previewImages.length - 1 && normalizedImages.length > 5"
            class="property-gallery__more"
          >
            +{{ normalizedImages.length - 5 }} more
          </span>
        </button>
      </div>
    </div>

    <div
      v-if="normalizedImages.length"
      class="property-gallery__mobile"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
    >
      <button
        type="button"
        class="property-gallery__mobile-image"
        :aria-label="`Open photo ${activeIndex + 1} of ${normalizedImages.length}`"
        @click="openLightbox(activeIndex)"
      >
        <span v-if="!loadedImages.has(activeImage)" class="property-gallery__skeleton" />
        <img
          :src="activeImage"
          :alt="`${title} property photo ${activeIndex + 1}`"
          :fetchpriority="activeIndex === 0 ? 'high' : undefined"
          decoding="async"
          @load="markLoaded(activeImage)"
        />
      </button>

      <button
        v-if="normalizedImages.length > 1"
        type="button"
        class="property-gallery__mobile-arrow is-previous"
        aria-label="Previous property photo"
        @click="selectPrevious"
      >
        <IonIcon :icon="chevronBackOutline" aria-hidden="true" />
      </button>
      <button
        v-if="normalizedImages.length > 1"
        type="button"
        class="property-gallery__mobile-arrow is-next"
        aria-label="Next property photo"
        @click="selectNext"
      >
        <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
      </button>
    </div>

    <div v-else class="property-gallery__empty">
      <IonIcon :icon="imageOutline" aria-hidden="true" />
      <strong>Photos are not available</strong>
      <span>Contact the property owner for current images.</span>
    </div>

    <div v-if="normalizedImages.length" class="property-gallery__overlays">
      <span
        class="property-gallery__status"
        :class="{
          'is-booking': isAvailable && availabilityLabel === 'Booking',
          'is-unavailable': !isAvailable,
        }"
      >
        <span aria-hidden="true" />
        {{ isAvailable ? availabilityLabel : 'Unavailable' }}
      </span>
      <span class="property-gallery__counter">
        {{ activeIndex + 1 }} / {{ normalizedImages.length }}
      </span>
    </div>

    <button
      v-if="normalizedImages.length > 1"
      type="button"
      class="property-gallery__view-all"
      @click="openLightbox(activeIndex)"
    >
      <IonIcon :icon="imagesOutline" aria-hidden="true" />
      View all photos
    </button>
  </section>

  <PropertyLightbox
    :open="isLightboxOpen"
    :images="normalizedImages"
    :initial-index="activeIndex"
    :title="title"
    @close="isLightboxOpen = false"
    @select="activeIndex = $event"
  />
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  chevronBackOutline,
  chevronForwardOutline,
  imageOutline,
  imagesOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'

import PropertyLightbox from './PropertyLightbox.vue'

const props = withDefaults(
  defineProps<{
    images: string[]
    title: string
    isAvailable: boolean
    availabilityLabel?: 'Available' | 'Booking'
  }>(),
  {
    availabilityLabel: 'Available',
  }
)

const activeIndex = ref(0)
const isLightboxOpen = ref(false)
const loadedImages = ref(new Set<string>())
const pointerStartX = ref<number | null>(null)
const pointerStartY = ref<number | null>(null)

const normalizedImages = computed(() =>
  props.images
    .map((image) => image.trim())
    .filter(Boolean)
    .filter((image, index, images) => images.indexOf(image) === index)
)
const previewImages = computed(() => normalizedImages.value.slice(1, 5))
const activeImage = computed(() => normalizedImages.value[activeIndex.value] ?? '')

watch(
  () => normalizedImages.value.length,
  (imageCount) => {
    if (activeIndex.value >= imageCount) activeIndex.value = 0
  }
)

function markLoaded(image: string) {
  loadedImages.value = new Set([...loadedImages.value, image])
}

function openLightbox(index: number) {
  activeIndex.value = index
  isLightboxOpen.value = true
}

function selectPrevious() {
  if (normalizedImages.value.length < 2) return
  activeIndex.value =
    (activeIndex.value - 1 + normalizedImages.value.length) % normalizedImages.value.length
}

function selectNext() {
  if (normalizedImages.value.length < 2) return
  activeIndex.value = (activeIndex.value + 1) % normalizedImages.value.length
}

function handlePointerDown(event: PointerEvent) {
  pointerStartX.value = event.clientX
  pointerStartY.value = event.clientY
}

function handlePointerUp(event: PointerEvent) {
  if (pointerStartX.value === null || pointerStartY.value === null) return

  const horizontalDistance = event.clientX - pointerStartX.value
  const verticalDistance = event.clientY - pointerStartY.value
  pointerStartX.value = null
  pointerStartY.value = null

  if (
    Math.abs(horizontalDistance) > 48 &&
    Math.abs(horizontalDistance) > Math.abs(verticalDistance)
  ) {
    if (horizontalDistance > 0) selectPrevious()
    else selectNext()
  }
}
</script>

<style scoped>
.property-gallery {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgb(226 232 240);
  border-radius: 20px;
  background: rgb(241 245 249);
  outline: none;
}

.property-gallery:focus-visible {
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.3);
}

.property-gallery__desktop {
  display: grid;
  min-height: 440px;
  grid-template-columns: minmax(0, 1.65fr) minmax(240px, 0.85fr);
  gap: 4px;
}

.property-gallery__hero,
.property-gallery__previews button,
.property-gallery__mobile-image {
  position: relative;
  min-width: 0;
  overflow: hidden;
  background: rgb(226 232 240);
}

.property-gallery__hero.is-single {
  grid-column: 1 / -1;
}

.property-gallery img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.property-gallery button:hover img {
  transform: scale(1.025);
}

.property-gallery__previews {
  display: grid;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 4px;
}

.property-gallery__previews.has-1 {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.property-gallery__previews.has-2 {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.property-gallery__previews.has-3 button:first-child {
  grid-column: 1 / -1;
}

.property-gallery__more {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 0.58);
  color: white;
  font-size: 14px;
  font-weight: 800;
  backdrop-filter: blur(2px);
}

.property-gallery__skeleton {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    100deg,
    rgb(226 232 240) 20%,
    rgb(241 245 249) 38%,
    rgb(226 232 240) 56%
  );
  background-size: 200% 100%;
  animation: property-gallery-shimmer 1.4s linear infinite;
}

.property-gallery__overlays {
  position: absolute;
  inset: 14px 14px auto;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  pointer-events: none;
}

.property-gallery__status,
.property-gallery__counter {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  border: 1px solid rgb(255 255 255 / 0.72);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.9);
  padding: 0 11px;
  color: rgb(15 23 42);
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.12);
  backdrop-filter: blur(12px);
}

.property-gallery__status span {
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  background: rgb(16 185 129);
}

.property-gallery__status.is-unavailable span {
  background: rgb(245 158 11);
}

.property-gallery__status.is-booking span {
  background: rgb(220 38 38);
}

.property-gallery__view-all {
  position: absolute;
  z-index: 3;
  right: 14px;
  bottom: 14px;
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 7px;
  border: 1px solid rgb(255 255 255 / 0.7);
  border-radius: 11px;
  background: rgb(255 255 255 / 0.92);
  padding: 0 13px;
  color: rgb(15 23 42);
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 8px 22px rgb(15 23 42 / 0.15);
  backdrop-filter: blur(12px);
  transition:
    background 200ms ease,
    transform 200ms ease;
}

.property-gallery__view-all:hover {
  background: white;
  transform: translateY(-1px);
}

.property-gallery__mobile {
  position: relative;
  display: none;
  aspect-ratio: 4 / 3;
}

.property-gallery__mobile-image {
  width: 100%;
  height: 100%;
}

.property-gallery__mobile-arrow {
  position: absolute;
  z-index: 3;
  top: 50%;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.7);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.9);
  color: rgb(15 23 42);
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.16);
  transform: translateY(-50%);
  backdrop-filter: blur(10px);
}

.property-gallery__mobile-arrow.is-previous {
  left: 12px;
}

.property-gallery__mobile-arrow.is-next {
  right: 12px;
}

.property-gallery__empty {
  display: grid;
  min-height: 360px;
  place-content: center;
  justify-items: center;
  padding: 32px;
  color: rgb(100 116 139);
  text-align: center;
}

.property-gallery__empty ion-icon {
  margin-bottom: 12px;
  font-size: 42px;
}

.property-gallery__empty strong {
  color: rgb(15 23 42);
  font-size: 16px;
}

.property-gallery__empty span {
  margin-top: 6px;
  font-size: 12px;
}

button:focus-visible {
  outline: 3px solid rgb(59 130 246);
  outline-offset: -3px;
}

@keyframes property-gallery-shimmer {
  to {
    background-position-x: -200%;
  }
}

:global(.dark) .property-gallery {
  border-color: rgb(51 65 85);
  background: rgb(15 23 42);
}

:global(.dark) .property-gallery__hero,
:global(.dark) .property-gallery__previews button,
:global(.dark) .property-gallery__mobile-image {
  background: rgb(30 41 59);
}

:global(.dark) .property-gallery__empty strong {
  color: white;
}

@media (max-width: 767px) {
  .property-gallery {
    border-radius: 0;
    border-right: 0;
    border-left: 0;
  }

  .property-gallery__desktop {
    display: none;
  }

  .property-gallery__mobile {
    display: block;
  }

  .property-gallery__view-all {
    right: 12px;
    bottom: 12px;
  }

  .property-gallery__overlays {
    inset: 12px 12px auto;
  }

  .property-gallery__counter {
    margin-left: auto;
  }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .property-gallery__desktop {
    min-height: 390px;
    grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.8fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .property-gallery img,
  .property-gallery__view-all {
    transition: none;
  }

  .property-gallery button:hover img,
  .property-gallery__view-all:hover {
    transform: none;
  }

  .property-gallery__skeleton {
    animation: none;
  }
}
</style>
