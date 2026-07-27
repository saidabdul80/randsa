import { nextTick, onBeforeUnmount, type Ref, watch } from 'vue'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useModalDialog(
  isOpen: Ref<boolean>,
  dialogRef: Ref<HTMLElement | null>,
  close: () => void
) {
  let previousActiveElement: HTMLElement | null = null
  let previousBodyOverflow = ''

  watch(
    isOpen,
    async (open) => {
      if (typeof document === 'undefined') return

      if (open) {
        previousActiveElement = document.activeElement as HTMLElement | null
        previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        await nextTick()

        const firstFocusable = dialogRef.value?.querySelector<HTMLElement>(focusableSelector)
        ;(firstFocusable ?? dialogRef.value)?.focus()
        return
      }

      document.body.style.overflow = previousBodyOverflow
      previousActiveElement?.focus()
      previousActiveElement = null
    },
    { flush: 'post' }
  )

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key !== 'Tab' || !dialogRef.value) return

    const focusableElements = [...dialogRef.value.querySelectorAll<HTMLElement>(focusableSelector)]

    if (!focusableElements.length) {
      event.preventDefault()
      dialogRef.value.focus()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined' && isOpen.value) {
      document.body.style.overflow = previousBodyOverflow
    }
  })

  return { handleKeydown }
}
