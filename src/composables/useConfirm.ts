import { readonly, ref } from 'vue'

/**
 * In-app replacement for `window.confirm`.
 *
 * Native dialogs cannot be styled, are rendered by the OS rather than the app, and in a
 * mobile webview they read as a crash. This keeps the same await-a-boolean ergonomics
 * while rendering a themed, focus-trapped dialog.
 *
 *   if (!(await confirmAction({ title: 'Delete listing?', tone: 'danger' }))) return
 */
export interface ConfirmRequest {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

const request = ref<ConfirmRequest | null>(null)
let resolveCurrent: ((confirmed: boolean) => void) | null = null

export const activeConfirmRequest = readonly(request)

export function confirmAction(options: ConfirmRequest): Promise<boolean> {
  // A second prompt while one is open cancels the first rather than orphaning its promise.
  resolveCurrent?.(false)

  request.value = options

  return new Promise<boolean>((resolve) => {
    resolveCurrent = resolve
  })
}

export function resolveActiveConfirm(confirmed: boolean) {
  resolveCurrent?.(confirmed)
  resolveCurrent = null
  request.value = null
}
