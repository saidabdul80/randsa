<template>
  <div class="grid gap-4">
    <label class="inline-flex w-fit cursor-pointer rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
      <input
        class="hidden"
        type="file"
        accept="image/*"
        multiple
        :disabled="isProcessing"
        @change="handleFiles"
      >
      {{ isProcessing ? 'Preparing images...' : 'Upload images' }}
    </label>

    <p class="text-sm leading-6 text-mist dark:text-slate-300">
      Upload up to {{ maxImages }} property images. We compress them in the browser before upload and aim to keep each file around 200KB-500KB when possible.
    </p>

    <p
      v-if="errorMessage"
      class="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
    >
      {{ errorMessage }}
    </p>

    <p
      v-if="isProcessing"
      class="rounded-[20px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100"
    >
      Compressing and preparing your selected images for secure upload...
    </p>

    <div v-if="modelValue.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="(image, index) in modelValue"
        :key="image.id"
        class="overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
      >
        <img :src="image.previewUrl" alt="Property preview" class="h-40 w-full object-cover">
        <div class="space-y-2 px-4 py-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Image {{ index + 1 }}</p>
            <button
              type="button"
              class="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
              @click="removeImage(index)"
            >
              Remove
            </button>
          </div>
          <p class="truncate text-xs text-slate-500 dark:text-slate-400">
            {{ image.fileName }}
          </p>
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{{ image.source === 'remote' ? 'Saved in Storage' : 'Ready to upload' }}</span>
            <span>{{ formatBytes(image.size) }}</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

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
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: PropertyImageInput[]]
  'processing-change': [value: boolean]
}>()

const errorMessage = ref('')
const isProcessing = ref(false)
const localPreviewUrls = new Set<string>()

function revokePreviewUrlIfNeeded(image: PropertyImageInput) {
  if (image.source === 'local' && localPreviewUrls.has(image.previewUrl)) {
    URL.revokeObjectURL(image.previewUrl)
    localPreviewUrls.delete(image.previewUrl)
  }
}

function removeImage(index: number) {
  const image = props.modelValue[index]

  if (image) {
    revokePreviewUrlIfNeeded(image)
  }

  const nextImages = props.modelValue.filter((_, currentIndex) => currentIndex !== index)
  emit('update:modelValue', nextImages)
}

watch(
  () => props.modelValue,
  (nextValue, previousValue) => {
    for (const image of previousValue ?? []) {
      if (!nextValue.some((current) => current.id === image.id)) {
        revokePreviewUrlIfNeeded(image)
      }
    }
  },
  { deep: false },
)

function formatBytes(bytes: number) {
  if (!bytes) {
    return 'Saved'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function handleFiles(event: Event) {
  errorMessage.value = ''

  const target = event.target as HTMLInputElement
  const fileList = target.files

  if (!fileList?.length) {
    return
  }

  const availableSlots = props.maxImages - props.modelValue.length

  if (availableSlots <= 0) {
    errorMessage.value = `You can only keep ${props.maxImages} images on one listing.`
    target.value = ''
    return
  }

  isProcessing.value = true
  emit('processing-change', true)
  const selectedFiles = Array.from(fileList).slice(0, availableSlots)

  try {
    const preparedImages: PropertyImageInput[] = []

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} is not a supported image file.`)
      }

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
    target.value = ''
  }
}

onBeforeUnmount(() => {
  for (const image of props.modelValue) {
    revokePreviewUrlIfNeeded(image)
  }
})
</script>
