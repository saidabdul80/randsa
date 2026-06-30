export const isLocalPaymentBypassEnabled =
  import.meta.env.VITE_ENABLE_LOCAL_PAYMENT_BYPASS === 'true'

export const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? ''
