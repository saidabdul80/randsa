<template>
  <div
    class="rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-500/30 dark:bg-emerald-500/10"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          Firebase Storage path tester
        </p>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-emerald-800 dark:text-emerald-100/90">
          This dev-only panel uploads real files to the exact rule paths we just deployed:
          <code class="rounded bg-white/70 px-2 py-1 text-xs dark:bg-slate-900/70"
            >users/{userId}/{fileName}</code
          >,
          <code class="rounded bg-white/70 px-2 py-1 text-xs dark:bg-slate-900/70"
            >agent-verifications/{agentId}/{fileName}</code
          >, and
          <code class="rounded bg-white/70 px-2 py-1 text-xs dark:bg-slate-900/70"
            >properties/{ownerId}/{propertyId}/{fileName}</code
          >.
        </p>
      </div>
      <span
        class="rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700 dark:bg-slate-900/70 dark:text-emerald-200"
      >
        Dev test
      </span>
    </div>

    <div
      v-if="setupMessage"
      class="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      {{ setupMessage }}
    </div>

    <div class="mt-5 grid gap-4 xl:grid-cols-3">
      <section class="rounded-[20px] bg-white/80 p-4 dark:bg-slate-900/70">
        <h4 class="text-sm font-bold text-ink dark:text-white">User path</h4>
        <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">
          Uploads a real file to your own profile folder.
        </p>
        <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Target:
          <span class="font-semibold">users/{{ profile?.uid ?? 'userId' }}/&lt;file&gt;</span>
        </p>
        <input
          class="mt-4 block w-full rounded-[16px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-emerald-500/20 dark:file:text-emerald-100"
          type="file"
          accept="image/*,.pdf,.txt"
          @change="handleFileSelect('user', $event)"
        />
        <button
          type="button"
          class="mt-4 w-full rounded-[16px] bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canUpload || !selectedUserFile || activeUpload === 'user'"
          @click="runUserUpload"
        >
          {{ activeUpload === 'user' ? 'Uploading...' : 'Test user upload' }}
        </button>
        <p
          v-if="results.user"
          class="mt-3 break-words text-xs leading-5 text-emerald-800 dark:text-emerald-100"
        >
          Uploaded to <span class="font-semibold">{{ results.user.fullPath }}</span
          >.
          <a :href="results.user.downloadURL" target="_blank" rel="noreferrer" class="underline"
            >Open file</a
          >
        </p>
      </section>

      <section class="rounded-[20px] bg-white/80 p-4 dark:bg-slate-900/70">
        <h4 class="text-sm font-bold text-ink dark:text-white">Agent verification path</h4>
        <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">
          Uploads a real file to the verification folder for the signed-in user.
        </p>
        <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Target:
          <span class="font-semibold"
            >agent-verifications/{{ profile?.uid ?? 'agentId' }}/&lt;file&gt;</span
          >
        </p>
        <input
          class="mt-4 block w-full rounded-[16px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-emerald-500/20 dark:file:text-emerald-100"
          type="file"
          accept="image/*,.pdf,.txt"
          @change="handleFileSelect('agent', $event)"
        />
        <button
          type="button"
          class="mt-4 w-full rounded-[16px] bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="!canUpload || !selectedAgentFile || activeUpload === 'agent'"
          @click="runAgentUpload"
        >
          {{ activeUpload === 'agent' ? 'Uploading...' : 'Test verification upload' }}
        </button>
        <p
          v-if="results.agent"
          class="mt-3 break-words text-xs leading-5 text-emerald-800 dark:text-emerald-100"
        >
          Uploaded to <span class="font-semibold">{{ results.agent.fullPath }}</span
          >.
          <a :href="results.agent.downloadURL" target="_blank" rel="noreferrer" class="underline"
            >Open file</a
          >
        </p>
      </section>

      <section class="rounded-[20px] bg-white/80 p-4 dark:bg-slate-900/70">
        <h4 class="text-sm font-bold text-ink dark:text-white">Property path</h4>
        <p class="mt-2 text-sm leading-6 text-mist dark:text-slate-300">
          Uploads a real file to a property folder for landlords, agents, and admins.
        </p>
        <label
          class="mt-4 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400"
        >
          Property ID
        </label>
        <input
          v-model="propertyId"
          type="text"
          placeholder="property-test-001"
          class="mt-2 w-full rounded-[16px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Target:
          <span class="font-semibold"
            >properties/{{ profile?.uid ?? 'ownerId' }}/{{
              propertyId || 'propertyId'
            }}/&lt;file&gt;</span
          >
        </p>
        <input
          class="mt-4 block w-full rounded-[16px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-semibold file:text-emerald-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:file:bg-emerald-500/20 dark:file:text-emerald-100"
          type="file"
          accept="image/*,.pdf,.txt"
          @change="handleFileSelect('property', $event)"
        />
        <button
          type="button"
          class="mt-4 w-full rounded-[16px] bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="
            !canUpload || !selectedPropertyFile || !propertyId.trim() || activeUpload === 'property'
          "
          @click="runPropertyUpload"
        >
          {{ activeUpload === 'property' ? 'Uploading...' : 'Test property upload' }}
        </button>
        <p
          v-if="results.property"
          class="mt-3 break-words text-xs leading-5 text-emerald-800 dark:text-emerald-100"
        >
          Uploaded to <span class="font-semibold">{{ results.property.fullPath }}</span
          >.
          <a :href="results.property.downloadURL" target="_blank" rel="noreferrer" class="underline"
            >Open file</a
          >
        </p>
      </section>
    </div>

    <div
      v-if="message"
      class="mt-4 rounded-[18px] px-4 py-3 text-sm"
      :class="
        messageTone === 'error'
          ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100'
          : 'border border-emerald-200 bg-emerald-100/70 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100'
      "
    >
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { authMode, isFirebaseConfigured } from '../../lib/firebase'
import {
  toStorageDisplayError,
  uploadAgentVerificationFile,
  uploadPropertyFile,
  uploadUserFile,
  type StorageUploadResult,
} from '../../services/storageUploads'
import type { UserProfile } from '../../types/user'

const props = defineProps<{
  profile: UserProfile | null
}>()

const selectedUserFile = ref<File | null>(null)
const selectedAgentFile = ref<File | null>(null)
const selectedPropertyFile = ref<File | null>(null)
const propertyId = ref('property-test-001')
const activeUpload = ref<'user' | 'agent' | 'property' | ''>('')
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const results = reactive<{
  user: StorageUploadResult | null
  agent: StorageUploadResult | null
  property: StorageUploadResult | null
}>({
  user: null,
  agent: null,
  property: null,
})

const canUpload = computed(
  () => Boolean(props.profile) && authMode === 'firebase' && isFirebaseConfigured
)
const setupMessage = computed(() => {
  if (!isFirebaseConfigured) {
    return 'Firebase web config is missing. Add the VITE_FIREBASE_* values and restart the dev server before testing uploads.'
  }

  if (authMode === 'local') {
    return 'Local auth bypass is still enabled in .env.local. Set VITE_ENABLE_LOCAL_AUTH_BYPASS=false, restart the dev server, register or sign in with Firebase, then come back here to run real uploads.'
  }

  if (!props.profile) {
    return 'Sign in with your Firebase account before testing Storage uploads.'
  }

  return ''
})

function handleFileSelect(kind: 'user' | 'agent' | 'property', event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  if (kind === 'user') {
    selectedUserFile.value = file
    return
  }

  if (kind === 'agent') {
    selectedAgentFile.value = file
    return
  }

  selectedPropertyFile.value = file
}

function setSuccess(copy: string) {
  messageTone.value = 'success'
  message.value = copy
}

function setError(error: unknown) {
  messageTone.value = 'error'
  message.value = toStorageDisplayError(error)
}

async function runUserUpload() {
  if (!props.profile || !selectedUserFile.value) {
    return
  }

  message.value = ''
  activeUpload.value = 'user'

  try {
    results.user = await uploadUserFile(props.profile, selectedUserFile.value)
    setSuccess(`User path upload worked: ${results.user.fullPath}`)
  } catch (error) {
    setError(error)
  } finally {
    activeUpload.value = ''
  }
}

async function runAgentUpload() {
  if (!props.profile || !selectedAgentFile.value) {
    return
  }

  message.value = ''
  activeUpload.value = 'agent'

  try {
    results.agent = await uploadAgentVerificationFile(props.profile, selectedAgentFile.value)
    setSuccess(`Agent verification path upload worked: ${results.agent.fullPath}`)
  } catch (error) {
    setError(error)
  } finally {
    activeUpload.value = ''
  }
}

async function runPropertyUpload() {
  if (!props.profile || !selectedPropertyFile.value) {
    return
  }

  message.value = ''
  activeUpload.value = 'property'

  try {
    results.property = await uploadPropertyFile(
      props.profile,
      propertyId.value,
      selectedPropertyFile.value
    )
    setSuccess(`Property path upload worked: ${results.property.fullPath}`)
  } catch (error) {
    setError(error)
  } finally {
    activeUpload.value = ''
  }
}
</script>
