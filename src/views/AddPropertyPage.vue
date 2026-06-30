<template>
  <AppShell
    eyebrow="Create"
    title="Add property"
    description="Create polished listings with dynamic fields, image uploads, and map-based location pinning."
  >
    <section class="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <div class="glass-panel p-6 sm:p-8">
        <PropertyForm
          :initial-value="initialValue"
          submit-label="Create property"
          :is-submitting="isSubmitting"
          @submit="handleCreate"
          @cancel="handleCancel"
        />
      </div>

      <div class="grid gap-4">
        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Access</p>
          <h2 class="mt-3 text-xl font-bold text-ink dark:text-white">Listing access is role based.</h2>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Only landlord, agent, and admin accounts can create listings. Tenant accounts stay focused on search, bookings, and saved properties.
          </p>
        </div>
        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Listing quality</p>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Add clear photos, precise location details, and complete fees so tenants can compare confidently before booking an inspection.
          </p>
        </div>
        <div
          v-if="statusMessage"
          class="rounded-[24px] border px-4 py-4 text-sm"
          :class="statusTone === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'"
        >
          {{ statusMessage }}
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
import PropertyForm from '../components/property/PropertyForm.vue'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { createEmptyPropertyInput, type PropertyFormInput } from '../types/property'

const router = useRouter()
const { state } = useAuth()
const { saveNewProperty } = useProperties()

const isSubmitting = ref(false)
const statusMessage = ref('')
const statusTone = ref<'error' | 'success'>('error')

const initialValue = computed(() => ({
  ...createEmptyPropertyInput(),
  ownerPhone: state.profile?.phone ?? '',
}))

async function handleCreate(value: PropertyFormInput) {
  statusMessage.value = ''

  if (!state.profile) {
    statusTone.value = 'error'
    statusMessage.value = 'You need to be signed in before you can add a property.'
    return
  }

  isSubmitting.value = true

  try {
    const property = await saveNewProperty(value, state.profile)
    statusTone.value = 'success'
    statusMessage.value = 'Property created successfully. Redirecting to the details page...'
    await router.replace(`/properties/${property.id}`)
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Could not create property.'
  } finally {
    isSubmitting.value = false
  }
}

function handleCancel() {
  void router.push('/properties')
}
</script>
