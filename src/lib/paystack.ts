import { paystackPublicKey } from './payments'

let paystackScriptPromise: Promise<void> | null = null

function ensurePaystackPublicKey() {
  if (!paystackPublicKey) {
    throw new Error('Paystack public key is missing. Add VITE_PAYSTACK_PUBLIC_KEY before starting checkout.')
  }
}

export function loadPaystackScript() {
  ensurePaystackPublicKey()

  if (typeof window === 'undefined') {
    throw new Error('Paystack checkout can only run in the browser.')
  }

  if (window.PaystackPop) {
    return Promise.resolve()
  }

  if (paystackScriptPromise) {
    return paystackScriptPromise
  }

  paystackScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-paystack-inline="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Could not load the Paystack checkout script.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.dataset.paystackInline = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the Paystack checkout script.'))
    document.head.appendChild(script)
  })

  return paystackScriptPromise
}

export async function openPaystackCheckout(options: {
  email: string
  amount: number
  reference: string
  metadata?: Record<string, unknown>
}) {
  ensurePaystackPublicKey()
  await loadPaystackScript()

  if (!window.PaystackPop) {
    throw new Error('Paystack checkout is not available right now.')
  }

  return new Promise<{ reference: string }>((resolve, reject) => {
    let closedAfterCallback = false

    const handler = window.PaystackPop?.setup({
      key: paystackPublicKey,
      email: options.email,
      amount: Math.round(options.amount * 100),
      ref: options.reference,
      currency: 'NGN',
      metadata: options.metadata,
      callback: (response) => {
        closedAfterCallback = true
        resolve({ reference: response.reference })
      },
      onClose: () => {
        if (!closedAfterCallback) {
          reject(new Error('Paystack checkout was closed before payment finished.'))
        }
      },
    })

    handler?.openIframe()
  })
}
