<template>
  <AppShell
    eyebrow="Trust"
    title="Agent verification"
    description="Submit identity, office, and authorization details so admins can review your agent profile."
    :show-bottom-nav="false"
  >
    <section class="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="glass-panel p-6 sm:p-8">
        <template v-if="profile?.role === 'agent'">
          <div
            class="rounded-[24px] border px-4 py-4 text-sm"
            :class="statusToneClass"
          >
            <span class="font-semibold">Current status:</span> {{ statusLabel }}
            <span v-if="currentRequest?.reviewedAt">
              | Reviewed {{ formatDateTime(currentRequest.reviewedAt) }}
            </span>
          </div>

          <div
            v-if="currentRequest?.adminNote"
            class="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <span class="font-semibold">Admin note:</span> {{ currentRequest.adminNote }}
          </div>

          <form class="mt-6 grid gap-5" @submit.prevent="handleSubmit">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
                Full name
                <input
                  v-model="form.fullName"
                  class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Your legal or business name"
                >
              </label>
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Phone number
                <input
                  v-model="form.phone"
                  class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="+234..."
                >
              </label>
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                WhatsApp number
                <input
                  v-model="form.whatsappNumber"
                  class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="+234..."
                >
              </label>
              <label class="text-sm font-semibold text-slate-700 dark:text-slate-200 md:col-span-2">
                Office address
                <textarea
                  v-model="form.officeAddress"
                  rows="4"
                  class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Office building, street, area, city, state"
                />
              </label>
            </div>

            <div class="grid gap-4">
              <VerificationUploadField
                v-model="form.profilePhoto"
                label="Profile photo"
                description="Upload a clear face photo for agent identity review."
                accept="image/*"
                :preview-as-image="true"
              />
              <VerificationUploadField
                v-model="form.idDocument"
                label="Government ID"
                description="National ID, driver's license, voter card, or international passport."
              />
              <VerificationUploadField
                v-model="form.cacDocument"
                label="CAC document"
                description="Optional business registration file if you operate through a company."
              />
              <VerificationUploadField
                v-model="form.authorizationDocument"
                label="Property authorization proof"
                description="Upload any document proving listing authority from the landlord or owner."
              />
            </div>

            <div
              v-if="errorMessage || verificationError"
              class="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {{ errorMessage || verificationError }}
            </div>

            <div
              v-if="successMessage"
              class="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
            >
              {{ successMessage }}
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                @click="prefillFromProfile"
              >
                Refill from profile
              </button>
              <button
                type="submit"
                class="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSubmitting"
              >
                {{ isSubmitting ? 'Submitting...' : submitLabel }}
              </button>
            </div>
          </form>
        </template>

        <template v-else>
          <div class="rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-5 text-sm text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
            Agent verification is only available to accounts with the <span class="font-semibold">agent</span> role. In local bypass mode, you can switch to the agent role from the profile page and come back here to test the full verification flow.
          </div>
        </template>
      </div>

      <div class="grid gap-4">
        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">What admins review</p>
          <div class="mt-4 grid gap-3">
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-mist dark:bg-slate-950/60 dark:text-slate-300">Profile photo matches the submitted identity.</div>
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-mist dark:bg-slate-950/60 dark:text-slate-300">Government ID is attached and readable.</div>
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-mist dark:bg-slate-950/60 dark:text-slate-300">Office address and phone numbers are present.</div>
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-mist dark:bg-slate-950/60 dark:text-slate-300">Property authorization proof is attached.</div>
          </div>
        </div>

        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Secure uploads</p>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Your verification files are uploaded with the request and shown only where review access is allowed.
          </p>
        </div>

        <div
          v-if="currentRequest"
          class="glass-panel p-6"
        >
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Last submission</p>
          <div class="mt-4 grid gap-3 text-sm text-mist dark:text-slate-300">
            <div>Submitted: <span class="font-semibold text-ink dark:text-white">{{ formatDateTime(currentRequest.submittedAt) }}</span></div>
            <div>Status: <span class="font-semibold text-ink dark:text-white">{{ formatStatus(currentRequest.status) }}</span></div>
            <div>WhatsApp: <span class="font-semibold text-ink dark:text-white">{{ currentRequest.whatsappNumber }}</span></div>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import VerificationUploadField from '../components/verification/VerificationUploadField.vue'
import AppShell from '../components/layout/AppShell.vue'
import { rehydrateAuthState, useAuth } from '../composables/useAuth'
import { useAgentVerification } from '../composables/useAgentVerification'
import {
  createEmptyAgentVerificationForm,
  formatVerificationStatusLabel,
  type AgentVerificationFormInput,
  type AgentVerificationRecord,
} from '../types/verification'

const { state } = useAuth()
const { currentRequest, error: verificationError, refreshForAgent, submitRequest } = useAgentVerification()

const form = reactive<AgentVerificationFormInput>(createEmptyAgentVerificationForm())
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

const profile = computed(() => state.profile)
const submitLabel = computed(() => (currentRequest.value ? 'Resubmit for review' : 'Submit for review'))
const statusLabel = computed(() =>
  formatVerificationStatusLabel(profile.value?.verificationStatus ?? 'not_submitted'),
)
const statusToneClass = computed(() => {
  const status = profile.value?.verificationStatus ?? 'not_submitted'

  if (status === 'approved') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
  }

  if (status === 'rejected') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
  }

  if (status === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
  }

  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200'
})

watch(
  () => profile.value?.uid,
  async (userId) => {
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const request = await refreshForAgent(userId)
      hydrateForm(request)
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Could not load the current verification request.'
    }
  },
  { immediate: true },
)

watch(
  currentRequest,
  (request) => {
    hydrateForm(request)
  },
)

async function handleSubmit() {
  if (!profile.value) {
    errorMessage.value = 'Sign in before submitting agent verification.'
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    await submitRequest(profile.value, { ...form })
    await rehydrateAuthState()
    successMessage.value =
      'Verification request submitted successfully. An admin can now approve or reject it from the dashboard.'
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not submit the verification request.'
  } finally {
    isSubmitting.value = false
  }
}

function prefillFromProfile() {
  if (!profile.value) {
    return
  }

  form.fullName = profile.value.fullName
  form.phone = profile.value.phone
  form.whatsappNumber = form.whatsappNumber || profile.value.phone
}

function hydrateForm(request: AgentVerificationRecord | null) {
  if (request) {
    Object.assign(form, {
      fullName: request.fullName,
      phone: request.phone,
      whatsappNumber: request.whatsappNumber,
      officeAddress: request.officeAddress,
      profilePhoto: request.profilePhoto,
      idDocument: request.idDocument,
      cacDocument: request.cacDocument,
      authorizationDocument: request.authorizationDocument,
    })
    return
  }

  Object.assign(form, createEmptyAgentVerificationForm())
  prefillFromProfile()
}

function formatStatus(status: AgentVerificationRecord['status']) {
  return formatVerificationStatusLabel(status)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>
