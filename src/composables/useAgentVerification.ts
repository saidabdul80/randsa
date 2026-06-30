import { computed, ref } from 'vue'

import {
  getAgentVerificationByAgentId,
  listAgentVerificationRequests,
  reviewAgentVerification,
  submitAgentVerification,
} from '../services/agentVerification'
import type { UserProfile } from '../types/user'
import type { AgentVerificationFormInput, AgentVerificationRecord } from '../types/verification'

const requests = ref<AgentVerificationRecord[]>([])
const currentRequest = ref<AgentVerificationRecord | null>(null)
const isLoading = ref(false)
const error = ref('')

export function useAgentVerification() {
  async function refreshAll() {
    requests.value = await listAgentVerificationRequests()
    return requests.value
  }

  async function refreshForAgent(agentId: string | null | undefined) {
    currentRequest.value = agentId ? await getAgentVerificationByAgentId(agentId) : null
    return currentRequest.value
  }

  async function submitRequest(agent: UserProfile, input: AgentVerificationFormInput) {
    isLoading.value = true
    error.value = ''

    try {
      const record = await submitAgentVerification(agent, input)
      currentRequest.value = record
      await refreshAll()
      return record
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not submit the verification request.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function reviewRequest(
    admin: UserProfile,
    verificationId: string,
    status: 'approved' | 'rejected',
    adminNote: string,
  ) {
    isLoading.value = true
    error.value = ''

    try {
      const record = await reviewAgentVerification(admin, verificationId, status, adminNote)
      currentRequest.value =
        currentRequest.value?.id === record.id ? record : currentRequest.value
      await refreshAll()
      return record
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not review the verification request.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  return {
    requests: computed(() => requests.value),
    currentRequest: computed(() => currentRequest.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    refreshAll,
    refreshForAgent,
    submitRequest,
    reviewRequest,
  }
}
