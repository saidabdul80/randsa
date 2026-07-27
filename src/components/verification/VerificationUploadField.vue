<template>
  <div
    class="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/60"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex-1">
        <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ label }}</p>
        <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">{{ description }}</p>
        <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Keep each file under {{ maxFileSizeMb }}MB. Files are now uploaded to Firebase Storage
          when you submit the verification form.
        </p>
      </div>

      <label
        class="inline-flex w-fit cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <input
          class="hidden"
          type="file"
          :accept="accept"
          :disabled="isProcessing"
          @change="handleFileChange"
        />
        {{ isProcessing ? 'Preparing...' : modelValue ? 'Replace file' : 'Upload file' }}
      </label>
    </div>

    <p
      v-if="errorMessage"
      class="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
    >
      {{ errorMessage }}
    </p>

    <div
      v-if="modelValue"
      class="mt-4 grid gap-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80"
    >
      <img
        v-if="showImagePreview"
        :src="modelValue.previewUrl"
        :alt="label"
        class="h-32 w-32 rounded-[22px] object-cover"
      />
      <div class="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
        <p class="font-semibold">{{ modelValue.name }}</p>
        <p>{{ formatBytes(modelValue.size) }}</p>
        <p class="break-all text-xs text-slate-500 dark:text-slate-400">
          {{ modelValue.mimeType }}
        </p>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ modelValue.source === 'remote' ? 'Saved in Storage' : 'Ready to upload' }}
        </p>
      </div>
      <button
        type="button"
        class="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        @click="clearFile"
      >
        Remove file
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { compressImageFile } from '../../lib/imageCompression'
import type { VerificationAsset } from '../../types/verification'

const props = withDefaults(
  defineProps<{
    modelValue: VerificationAsset | null
    label: string
    description: string
    accept?: string
    maxFileSizeMb?: number
    previewAsImage?: boolean
  }>(),
  {
    accept: 'image/*,.pdf',
    maxFileSizeMb: 2,
    previewAsImage: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: VerificationAsset | null]
}>()

const errorMessage = ref('')
const isProcessing = ref(false)
const localPreviewUrls = new Set<string>()

const showImagePreview = computed(
  () =>
    props.previewAsImage &&
    Boolean(props.modelValue?.mimeType.startsWith('image/') && props.modelValue?.previewUrl)
)

function revokePreviewIfNeeded(asset: VerificationAsset | null) {
  if (!asset) {
    return
  }

  if (asset.source === 'local' && localPreviewUrls.has(asset.previewUrl)) {
    URL.revokeObjectURL(asset.previewUrl)
    localPreviewUrls.delete(asset.previewUrl)
  }
}

watch(
  () => props.modelValue,
  (nextValue, previousValue) => {
    if (previousValue && nextValue?.id !== previousValue.id) {
      revokePreviewIfNeeded(previousValue)
    }
  }
)

async function handleFileChange(event: Event) {
  errorMessage.value = ''
  isProcessing.value = true

  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    isProcessing.value = false
    return
  }

  const maxBytes = props.maxFileSizeMb * 1024 * 1024

  try {
    const preparedFile = file.type.startsWith('image/')
      ? await compressImageFile(file, {
          maxBytes,
          maxDimension: 1600,
          targetBytes: Math.min(maxBytes, 850 * 1024),
          genericErrorMessage: 'Your browser could not prepare the selected verification image.',
        })
      : file

    if (!preparedFile.type.startsWith('image/') && preparedFile.size > maxBytes) {
      throw new Error(`Please select a file smaller than ${props.maxFileSizeMb}MB.`)
    }

    const previewUrl = preparedFile.type.startsWith('image/')
      ? URL.createObjectURL(preparedFile)
      : props.modelValue?.source === 'remote'
        ? props.modelValue.previewUrl
        : ''

    if (previewUrl && preparedFile.type.startsWith('image/')) {
      localPreviewUrls.add(previewUrl)
    }

    emit('update:modelValue', {
      id: `local-${crypto.randomUUID()}`,
      name: preparedFile.name,
      mimeType: preparedFile.type || 'application/octet-stream',
      size: preparedFile.size,
      previewUrl,
      remoteUrl: null,
      file: preparedFile,
      source: 'local',
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Could not upload the file.'
  } finally {
    isProcessing.value = false
    target.value = ''
  }
}

function clearFile() {
  errorMessage.value = ''
  revokePreviewIfNeeded(props.modelValue)
  emit('update:modelValue', null)
}

function formatBytes(bytes: number) {
  if (!bytes) {
    return 'Saved'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onBeforeUnmount(() => {
  revokePreviewIfNeeded(props.modelValue)
})
</script>
