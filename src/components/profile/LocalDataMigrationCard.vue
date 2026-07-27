<template>
  <section
    v-if="profile && authMode === 'firebase'"
    class="rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-5 dark:border-amber-500/30 dark:bg-amber-500/10"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-200">
          Local data cleanup
        </p>
        <h3 class="mt-2 text-lg font-bold text-ink dark:text-white">
          Migrate older browser-only records into Firebase
        </h3>
        <p class="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
          This moves local properties, bookings, and agent verification records owned by the current
          signed-in account into Firestore so they appear across devices and admin review screens.
        </p>
      </div>

      <button
        type="button"
        class="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isWorking || !preview?.hasAnythingToMigrate"
        @click="handleMigrate"
      >
        {{ isWorking ? 'Migrating...' : 'Migrate my local data' }}
      </button>
    </div>

    <div v-if="preview" class="mt-5 grid gap-3 md:grid-cols-3">
      <article class="rounded-[20px] bg-white/80 px-4 py-4 dark:bg-slate-950/60">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
          Properties
        </p>
        <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {{ preview.properties.eligible }} eligible of {{ preview.properties.detected }} detected
        </p>
      </article>
      <article class="rounded-[20px] bg-white/80 px-4 py-4 dark:bg-slate-950/60">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
          Bookings
        </p>
        <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {{ preview.bookings.eligible }} eligible of {{ preview.bookings.detected }} detected
        </p>
      </article>
      <article class="rounded-[20px] bg-white/80 px-4 py-4 dark:bg-slate-950/60">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200">
          Verification
        </p>
        <p class="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {{ preview.verifications.eligible }} eligible of
          {{ preview.verifications.detected }} detected
        </p>
      </article>
    </div>

    <div
      v-if="message"
      class="mt-4 rounded-[20px] border px-4 py-4 text-sm"
      :class="
        messageTone === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
          : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
      "
    >
      {{ message }}
    </div>

    <div v-if="preview?.notes.length" class="mt-4 grid gap-2">
      <p
        v-for="note in preview.notes"
        :key="note"
        class="rounded-[18px] bg-white/70 px-4 py-3 text-sm text-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
      >
        {{ note }}
      </p>
    </div>

    <div v-if="resultNotes.length" class="mt-4 grid gap-2">
      <p
        v-for="note in resultNotes"
        :key="note"
        class="rounded-[18px] bg-white/70 px-4 py-3 text-sm text-slate-700 dark:bg-slate-950/60 dark:text-slate-200"
      >
        {{ note }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { authMode } from '../../lib/firebase'
import {
  getLocalDataMigrationPreview,
  migrateLocalDataForCurrentProfile,
  type LocalMigrationPreview,
} from '../../services/localDataMigration'
import type { UserProfile } from '../../types/user'

const props = defineProps<{
  profile: UserProfile | null | undefined
}>()

const preview = ref<LocalMigrationPreview | null>(null)
const isWorking = ref(false)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const resultNotes = ref<string[]>([])

const profile = computed(() => props.profile ?? null)

watch(
  profile,
  async (value) => {
    preview.value = null
    message.value = ''
    resultNotes.value = []

    if (!value || authMode !== 'firebase') {
      return
    }

    try {
      preview.value = await getLocalDataMigrationPreview(value)
    } catch (error) {
      messageTone.value = 'error'
      message.value =
        error instanceof Error ? error.message : 'Could not inspect local records for migration.'
    }
  },
  { immediate: true }
)

async function handleMigrate() {
  if (!profile.value) {
    return
  }

  isWorking.value = true
  message.value = ''
  resultNotes.value = []

  try {
    const result = await migrateLocalDataForCurrentProfile(profile.value)
    resultNotes.value = result.notes
    messageTone.value = 'success'
    message.value =
      `Migration complete. Properties: ${result.properties.migrated} moved, ${result.properties.skipped} skipped, ${result.properties.failed} failed. ` +
      `Bookings: ${result.bookings.migrated} moved, ${result.bookings.skipped} skipped, ${result.bookings.failed} failed. ` +
      `Verification: ${result.verifications.migrated} moved, ${result.verifications.skipped} skipped, ${result.verifications.failed} failed.`
    preview.value = await getLocalDataMigrationPreview(profile.value)
  } catch (error) {
    messageTone.value = 'error'
    message.value = error instanceof Error ? error.message : 'Could not migrate the local records.'
  } finally {
    isWorking.value = false
  }
}
</script>
