import { computed, ref } from 'vue'

import {
  completeLocalPayment,
  createPaymentRecord,
  findLatestPaymentForUserProperty,
  getPaymentById,
  listPaymentsForProperty,
  listPaymentsForUser,
  preparePaymentCheckout,
  verifyPaymentWithBackend,
} from '../services/payments'
import type { PropertyRecord } from '../types/property'
import type { UserProfile } from '../types/user'
import type { PaymentRecord, PaymentType } from '../types/payment'

const payments = ref<PaymentRecord[]>([])
const isLoading = ref(false)
const error = ref('')

export function usePayments() {
  async function refreshForUser(userId: string | null | undefined) {
    payments.value = userId ? await listPaymentsForUser(userId) : []
    return payments.value
  }

  async function refreshForProperty(propertyId: string | null | undefined) {
    payments.value = propertyId ? await listPaymentsForProperty(propertyId) : []
    return payments.value
  }

  async function startPayment(
    user: UserProfile,
    property: PropertyRecord,
    paymentType: PaymentType,
    amount: number,
    bookingId: string | null = null
  ) {
    isLoading.value = true
    error.value = ''

    try {
      const payment = await createPaymentRecord(user, property, paymentType, amount, bookingId)
      await refreshForUser(user.uid)
      return payment
    } catch (caughtError) {
      error.value = caughtError instanceof Error ? caughtError.message : 'Could not create payment.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function finishLocalPayment(
    paymentId: string,
    userId: string,
    status: 'success' | 'failed'
  ) {
    isLoading.value = true
    error.value = ''

    try {
      const payment = await completeLocalPayment(paymentId, userId, status)
      await refreshForUser(userId)
      return payment
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not update payment status.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function verifyPayment(paymentId: string, userId: string, reference: string) {
    isLoading.value = true
    error.value = ''

    try {
      const payment = await verifyPaymentWithBackend(paymentId, reference)
      await refreshForUser(userId)
      return payment
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not verify the payment.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  async function prepareCheckout(payment: PaymentRecord) {
    isLoading.value = true
    error.value = ''

    try {
      return await preparePaymentCheckout(payment)
    } catch (caughtError) {
      error.value =
        caughtError instanceof Error ? caughtError.message : 'Could not prepare Paystack checkout.'
      throw caughtError
    } finally {
      isLoading.value = false
    }
  }

  return {
    payments: computed(() => payments.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    refreshForUser,
    refreshForProperty,
    findLatestPaymentForUserProperty,
    getPaymentById,
    startPayment,
    prepareCheckout,
    finishLocalPayment,
    verifyPayment,
  }
}
