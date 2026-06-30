/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_LOCAL_AUTH_BYPASS?: string
  readonly VITE_ENABLE_LOCAL_PAYMENT_BYPASS?: string
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string
  readonly VITE_FIREBASE_FUNCTIONS_REGION?: string
  readonly VITE_FIREBASE_VAPID_KEY?: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  PaystackPop?: {
    setup: (options: {
      key: string
      email: string
      amount: number
      ref: string
      currency?: string
      metadata?: Record<string, unknown>
      callback?: (response: { reference: string; trxref?: string; status?: string }) => void
      onClose?: () => void
    }) => {
      openIframe: () => void
    }
  }
}
