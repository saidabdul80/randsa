<template>
  <div class="image-uploader">
    <input
      ref="fileInput"
      class="image-uploader__input"
      type="file"
      accept="image/*"
      multiple
      :disabled="isProcessing"
      @change="handleInputChange"
    />

    <button
      type="button"
      class="image-uploader__dropzone"
      :class="{ dragging: isDragging, processing: isProcessing }"
      :disabled="isProcessing"
      @click="openFilePicker"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <span class="image-uploader__drop-icon">
        <IonIcon :icon="isProcessing ? syncOutline : cloudUploadOutline" aria-hidden="true" />
      </span>
      <span>
        <strong>{{
          isProcessing ? 'Optimizing selected images...' : 'Drop listing photos here'
        }}</strong>
        <small>or choose files from this device</small>
      </span>
      <span class="image-uploader__choose">Choose images</span>
    </button>

    <div class="image-uploader__meta">
      <p>JPG, PNG, or WebP. Up to {{ maxImages }} images.</p>
      <strong>{{ modelValue.length }} / {{ maxImages }} uploaded</strong>
    </div>

    <p v-if="errorMessage" class="image-uploader__message error" role="alert">
      <IonIcon :icon="alertCircleOutline" aria-hidden="true" />
      {{ errorMessage }}
    </p>

    <p v-if="isProcessing" class="image-uploader__message processing" role="status">
      <IonIcon :icon="syncOutline" class="spin" aria-hidden="true" />
      Images are being compressed in your browser before the existing Storage upload runs.
    </p>

    <div v-if="modelValue.length" class="image-uploader__gallery">
      <article v-for="(image, index) in modelValue" :key="image.id" class="image-uploader__card">
        <figure>
          <img :src="image.previewUrl" :alt="`Listing image ${index + 1}`" />
          <span v-if="index === 0" class="image-uploader__cover-badge">
            <IonIcon :icon="star" aria-hidden="true" />
            Cover
          </span>
          <span class="image-uploader__status">
            {{ image.source === 'remote' ? 'Saved' : 'Optimized' }}
          </span>
        </figure>

        <div class="image-uploader__card-body">
          <div>
            <strong>Image {{ index + 1 }}</strong>
            <small>{{ formatBytes(image.size) }}</small>
          </div>
          <p :title="image.fileName">{{ image.fileName }}</p>

          <div class="image-uploader__card-actions">
            <button
              type="button"
              title="Move image left"
              aria-label="Move image left"
              :disabled="index === 0"
              @click="moveImage(index, index - 1)"
            >
              <IonIcon :icon="arrowBackOutline" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Move image right"
              aria-label="Move image right"
              :disabled="index === modelValue.length - 1"
              @click="moveImage(index, index + 1)"
            >
              <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
            </button>
            <button
              v-if="index > 0"
              type="button"
              class="image-uploader__cover-command"
              @click="moveImage(index, 0)"
            >
              Set cover
            </button>
            <button
              type="button"
              class="danger"
              title="Remove image"
              aria-label="Remove image"
              @click="removeImage(index)"
            >
              <IonIcon :icon="trashOutline" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  cloudUploadOutline,
  star,
  syncOutline,
  trashOutline,
} from 'ionicons/icons'
import { ref, watch } from 'vue'

import { compressImageFile } from '../../lib/imageCompression'
import {
  MAX_PROPERTY_IMAGES,
  PROPERTY_IMAGE_MAX_DIMENSION,
  PROPERTY_IMAGE_TARGET_MAX_BYTES,
  PROPERTY_IMAGE_UPLOAD_MAX_BYTES,
  type PropertyImageInput,
} from '../../types/property'

const props = withDefaults(
  defineProps<{
    modelValue: PropertyImageInput[]
    maxImages?: number
  }>(),
  {
    maxImages: MAX_PROPERTY_IMAGES,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: PropertyImageInput[]]
  'processing-change': [value: boolean]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const errorMessage = ref('')
const isProcessing = ref(false)
const isDragging = ref(false)
const localPreviewUrls = new Set<string>()

watch(
  () => props.modelValue,
  (nextValue, previousValue) => {
    for (const image of nextValue) {
      if (image.source === 'local' && image.previewUrl.startsWith('blob:')) {
        localPreviewUrls.add(image.previewUrl)
      }
    }

    for (const image of previousValue ?? []) {
      if (!nextValue.some((current) => current.id === image.id)) revokePreviewUrlIfNeeded(image)
    }
  },
  { deep: false, immediate: true }
)

function openFilePicker() {
  fileInput.value?.click()
}

function handleDragLeave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement
  const nextTarget = event.relatedTarget as Node | null
  if (!nextTarget || !target.contains(nextTarget)) isDragging.value = false
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files.length) void prepareFiles(Array.from(event.dataTransfer.files))
}

function handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) void prepareFiles(Array.from(target.files))
  target.value = ''
}

function revokePreviewUrlIfNeeded(image: PropertyImageInput) {
  if (image.source === 'local' && localPreviewUrls.has(image.previewUrl)) {
    URL.revokeObjectURL(image.previewUrl)
    localPreviewUrls.delete(image.previewUrl)
  }
}

function removeImage(index: number) {
  const image = props.modelValue[index]
  if (image) revokePreviewUrlIfNeeded(image)
  emit(
    'update:modelValue',
    props.modelValue.filter((_, currentIndex) => currentIndex !== index)
  )
}

function moveImage(from: number, to: number) {
  if (to < 0 || to >= props.modelValue.length || from === to) return
  const nextImages = [...props.modelValue]
  const [image] = nextImages.splice(from, 1)
  if (!image) return
  nextImages.splice(to, 0, image)
  emit('update:modelValue', nextImages)
}

function formatBytes(bytes: number) {
  if (!bytes) return 'Stored in Firebase'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function prepareFiles(files: File[]) {
  errorMessage.value = ''
  const availableSlots = props.maxImages - props.modelValue.length

  if (availableSlots <= 0) {
    errorMessage.value = `You can only keep ${props.maxImages} images on one listing.`
    return
  }

  const selectedFiles = files.slice(0, availableSlots)
  if (files.length > availableSlots) {
    errorMessage.value = `Only the first ${availableSlots} selected image${availableSlots === 1 ? '' : 's'} fit in this listing.`
  }

  isProcessing.value = true
  emit('processing-change', true)

  try {
    const preparedImages: PropertyImageInput[] = []

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/'))
        throw new Error(`${file.name} is not a supported image file.`)

      const compressedFile = await compressImageFile(file, {
        maxBytes: PROPERTY_IMAGE_UPLOAD_MAX_BYTES,
        maxDimension: PROPERTY_IMAGE_MAX_DIMENSION,
        targetBytes: PROPERTY_IMAGE_TARGET_MAX_BYTES,
        genericErrorMessage: 'Your browser could not prepare the selected image for upload.',
      })
      const previewUrl = URL.createObjectURL(compressedFile)
      localPreviewUrls.add(previewUrl)

      preparedImages.push({
        id: `local-${crypto.randomUUID()}`,
        source: 'local',
        previewUrl,
        remoteUrl: null,
        file: compressedFile,
        fileName: compressedFile.name,
        mimeType: compressedFile.type,
        size: compressedFile.size,
      })
    }

    emit('update:modelValue', [...props.modelValue, ...preparedImages])
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not prepare the selected images.'
  } finally {
    isProcessing.value = false
    emit('processing-change', false)
  }
}
</script>

<style scoped>
.image-uploader {
  display: grid;
  gap: 12px;
}
.image-uploader__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}
.image-uploader__dropzone {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  width: 100%;
  border: 1px dashed #aebfd2;
  border-radius: 14px;
  background: #f8fbff;
  padding: 20px;
  color: #425a73;
  text-align: left;
  transition:
    border-color 160ms ease,
    background 160ms ease;
}
.image-uploader__dropzone:hover,
.image-uploader__dropzone.dragging {
  border-color: #1769ef;
  background: #f0f6ff;
}
.image-uploader__dropzone.processing {
  cursor: wait;
}
.image-uploader__drop-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background: #e7f0ff;
  color: #1769ef;
}
.image-uploader__drop-icon ion-icon {
  font-size: 21px;
}
.image-uploader__dropzone strong,
.image-uploader__dropzone small {
  display: block;
}
.image-uploader__dropzone strong {
  color: #1f354d;
  font-size: 10px;
}
.image-uploader__dropzone small {
  margin-top: 4px;
  color: #7b8ca0;
  font-size: 8px;
}
.image-uploader__choose {
  border-radius: 9px;
  background: #1769ef;
  padding: 9px 11px;
  color: #fff;
  font-size: 8px;
  font-weight: 800;
}
.image-uploader__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #8391a2;
  font-size: 7px;
}
.image-uploader__meta p {
  margin: 0;
}
.image-uploader__meta strong {
  color: #52677e;
}
.image-uploader__message {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 8px;
  line-height: 1.5;
}
.image-uploader__message ion-icon {
  flex: 0 0 auto;
  font-size: 16px;
}
.image-uploader__message.error {
  border: 1px solid #fecdd3;
  background: #fff1f2;
  color: #be123c;
}
.image-uploader__message.processing {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}
.image-uploader__message .spin {
  animation: image-uploader-spin 1s linear infinite;
}
.image-uploader__gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.image-uploader__card {
  overflow: hidden;
  border: 1px solid #e0e7ef;
  border-radius: 13px;
  background: #fff;
}
.image-uploader__card figure {
  position: relative;
  height: 126px;
  margin: 0;
  background: #edf2f7;
}
.image-uploader__card figure img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-uploader__cover-badge,
.image-uploader__status {
  position: absolute;
  top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 7px;
  font-size: 7px;
  font-weight: 850;
  backdrop-filter: blur(8px);
}
.image-uploader__cover-badge {
  left: 8px;
  color: #155fcf;
}
.image-uploader__status {
  right: 8px;
  color: #07834d;
}
.image-uploader__card-body {
  padding: 10px;
}
.image-uploader__card-body > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.image-uploader__card-body strong {
  color: #243950;
  font-size: 8px;
}
.image-uploader__card-body small {
  color: #8090a2;
  font-size: 7px;
}
.image-uploader__card-body p {
  overflow: hidden;
  margin: 5px 0 9px;
  color: #7a899a;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.image-uploader__card-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}
.image-uploader__card-actions button {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 1px solid #dfe6ee;
  border-radius: 7px;
  background: #fff;
  color: #526980;
}
.image-uploader__card-actions button:disabled {
  opacity: 0.35;
}
.image-uploader__card-actions .image-uploader__cover-command {
  display: inline-flex;
  width: auto;
  margin-left: auto;
  padding: 0 7px;
  color: #1763d7;
  font-size: 7px;
  font-weight: 800;
}
.image-uploader__card-actions .danger {
  margin-left: auto;
  color: #e11d48;
}
.image-uploader__card-actions .image-uploader__cover-command + .danger {
  margin-left: 0;
}

@keyframes image-uploader-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .image-uploader__dropzone {
    grid-template-columns: auto minmax(0, 1fr);
    padding: 15px;
  }
  .image-uploader__choose {
    grid-column: 1 / -1;
    text-align: center;
  }
  .image-uploader__gallery {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-uploader__message .spin {
    animation: none;
  }
}

:global(.dark) .image-uploader__dropzone,
:global(.dark) .image-uploader__card,
:global(.dark) .image-uploader__card-actions button {
  border-color: #2a394b;
  background: #111c2a;
  color: #dbe5ef;
}
:global(.dark) .image-uploader__dropzone strong,
:global(.dark) .image-uploader__card-body strong {
  color: #f8fafc;
}
:global(.dark) .image-uploader__dropzone:hover,
:global(.dark) .image-uploader__dropzone.dragging {
  border-color: #4f8df2;
  background: #16263a;
}
</style>
