<template>
  <Teleport to="body">
    <Transition name="property-lightbox">
      <div
        v-if="open && normalizedImages.length"
        class="property-lightbox-backdrop"
        role="presentation"
        @mousedown.self="$emit('close')"
      >
        <section
          ref="dialogRef"
          class="property-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby="property-lightbox-title"
          tabindex="-1"
          @keydown="handleKeydown"
        >
          <header class="property-lightbox__header">
            <div>
              <p id="property-lightbox-title">{{ title }}</p>
              <span>{{ currentIndex + 1 }} / {{ normalizedImages.length }}</span>
            </div>
            <button type="button" aria-label="Close photo viewer" @click="$emit('close')">
              <IonIcon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <div
            class="property-lightbox__stage"
            @pointerdown="handlePointerDown"
            @pointerup="handlePointerUp"
          >
            <button
              v-if="normalizedImages.length > 1"
              type="button"
              class="property-lightbox__arrow is-previous"
              aria-label="Previous property photo"
              @click="selectPrevious"
            >
              <IonIcon :icon="chevronBackOutline" aria-hidden="true" />
            </button>

            <img
              :src="currentImage"
              :alt="`${title} photo ${currentIndex + 1}`"
              :class="{ 'is-zoomed': isZoomed }"
              decoding="async"
              @dblclick="toggleZoom"
            />

            <button
              v-if="normalizedImages.length > 1"
              type="button"
              class="property-lightbox__arrow is-next"
              aria-label="Next property photo"
              @click="selectNext"
            >
              <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
            </button>
          </div>

          <div
            v-if="normalizedImages.length > 1"
            class="property-lightbox__thumbnails"
            aria-label="Property photo thumbnails"
          >
            <button
              v-for="(image, index) in normalizedImages"
              :key="`${image}-${index}`"
              type="button"
              :class="{ 'is-active': index === currentIndex }"
              :aria-label="`View photo ${index + 1}`"
              :aria-current="index === currentIndex ? 'true' : undefined"
              @click="selectImage(index)"
            >
              <img :src="image" :alt="`${title} thumbnail ${index + 1}`" loading="lazy" />
            </button>
          </div>

          <p class="property-lightbox__hint">Double-click or double-tap the photo to zoom.</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronBackOutline, chevronForwardOutline, closeOutline } from 'ionicons/icons'
import { computed, ref, toRef, watch } from 'vue'

import { useModalDialog } from '../../../composables/useModalDialog'

const props = defineProps<{
  open: boolean
  images: string[]
  initialIndex: number
  title: string
}>()

const emit = defineEmits<{
  close: []
  select: [index: number]
}>()

const dialogRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const isZoomed = ref(false)
const pointerStartX = ref<number | null>(null)
const pointerStartY = ref<number | null>(null)
let lastTapAt = 0

const normalizedImages = computed(() =>
  props.images
    .map((image) => image.trim())
    .filter(Boolean)
    .filter((image, index, images) => images.indexOf(image) === index)
)
const currentImage = computed(() => normalizedImages.value[currentIndex.value] ?? '')

const { handleKeydown: handleModalKeydown } = useModalDialog(toRef(props, 'open'), dialogRef, () =>
  emit('close')
)

watch(
  () => [props.open, props.initialIndex, normalizedImages.value.length] as const,
  ([open, initialIndex, imageCount]) => {
    if (!open) {
      isZoomed.value = false
      return
    }

    currentIndex.value = Math.min(Math.max(initialIndex, 0), Math.max(imageCount - 1, 0))
  },
  { immediate: true }
)

function selectImage(index: number) {
  currentIndex.value = index
  isZoomed.value = false
  emit('select', index)
}

function selectPrevious() {
  const nextIndex =
    (currentIndex.value - 1 + normalizedImages.value.length) % normalizedImages.value.length
  selectImage(nextIndex)
}

function selectNext() {
  const nextIndex = (currentIndex.value + 1) % normalizedImages.value.length
  selectImage(nextIndex)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' && normalizedImages.value.length > 1) {
    event.preventDefault()
    selectPrevious()
    return
  }

  if (event.key === 'ArrowRight' && normalizedImages.value.length > 1) {
    event.preventDefault()
    selectNext()
    return
  }

  handleModalKeydown(event)
}

function toggleZoom() {
  isZoomed.value = !isZoomed.value
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
    normalizedImages.value.length > 1 &&
    Math.abs(horizontalDistance) > 52 &&
    Math.abs(horizontalDistance) > Math.abs(verticalDistance)
  ) {
    if (horizontalDistance > 0) selectPrevious()
    else selectNext()
    return
  }

  if (event.pointerType === 'touch' && Math.abs(horizontalDistance) < 10) {
    const tappedAt = Date.now()
    if (tappedAt - lastTapAt < 320) toggleZoom()
    lastTapAt = tappedAt
  }
}
</script>

<style scoped>
.property-lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(3 10 22 / 0.94);
  backdrop-filter: blur(12px);
}

.property-lightbox {
  display: grid;
  width: min(1180px, 100%);
  max-height: calc(100dvh - 40px);
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 14px;
  color: white;
  outline: none;
}

.property-lightbox__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.property-lightbox__header p {
  max-width: min(70vw, 720px);
  overflow: hidden;
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-lightbox__header span {
  display: block;
  margin-top: 3px;
  color: rgb(203 213 225);
  font-size: 12px;
  font-weight: 700;
}

.property-lightbox__header button,
.property-lightbox__arrow {
  display: inline-grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.12);
  color: white;
  font-size: 22px;
  transition:
    background 200ms ease,
    transform 200ms ease;
}

.property-lightbox__header button:hover,
.property-lightbox__arrow:hover {
  background: rgb(255 255 255 / 0.22);
}

.property-lightbox__stage {
  position: relative;
  display: grid;
  min-height: 0;
  place-items: center;
  overflow: auto;
  border-radius: 18px;
  background: rgb(15 23 42 / 0.62);
  touch-action: pinch-zoom;
}

.property-lightbox__stage > img {
  width: 100%;
  height: 100%;
  max-height: calc(100dvh - 230px);
  object-fit: contain;
  transition: transform 200ms ease;
  user-select: none;
}

.property-lightbox__stage > img.is-zoomed {
  transform: scale(1.7);
  cursor: zoom-out;
}

.property-lightbox__arrow {
  position: absolute;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
}

.property-lightbox__arrow.is-previous {
  left: 14px;
}

.property-lightbox__arrow.is-next {
  right: 14px;
}

.property-lightbox__thumbnails {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 2px 1px 6px;
  scrollbar-width: thin;
}

.property-lightbox__thumbnails button {
  width: 78px;
  height: 58px;
  flex: 0 0 auto;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 10px;
  opacity: 0.58;
  transition:
    opacity 200ms ease,
    border-color 200ms ease;
}

.property-lightbox__thumbnails button.is-active {
  border-color: rgb(59 130 246);
  opacity: 1;
}

.property-lightbox__thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.property-lightbox__hint {
  text-align: center;
  color: rgb(148 163 184);
  font-size: 11px;
}

.property-lightbox-enter-active,
.property-lightbox-leave-active {
  transition: opacity 200ms ease;
}

.property-lightbox-enter-from,
.property-lightbox-leave-to {
  opacity: 0;
}

button:focus-visible {
  outline: 2px solid rgb(96 165 250);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .property-lightbox-backdrop {
    padding: 12px;
  }

  .property-lightbox {
    max-height: calc(100dvh - 24px);
  }

  .property-lightbox__stage {
    border-radius: 14px;
  }

  .property-lightbox__stage > img {
    max-height: calc(100dvh - 210px);
  }

  .property-lightbox__arrow {
    width: 44px;
    height: 44px;
  }

  .property-lightbox__thumbnails button {
    width: 64px;
    height: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .property-lightbox-enter-active,
  .property-lightbox-leave-active,
  .property-lightbox__header button,
  .property-lightbox__arrow,
  .property-lightbox__stage > img,
  .property-lightbox__thumbnails button {
    transition: none;
  }
}
</style>
