<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div v-if="request" class="confirm-root">
        <div class="confirm-scrim" @click="resolveWith(false)" />

        <div
          ref="panelRef"
          class="confirm-panel"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="request.message ? bodyId : undefined"
          @keydown.esc="resolveWith(false)"
          @keydown.tab="trapFocus"
        >
          <p class="rd-eyebrow"><span class="rd-rule" aria-hidden="true"></span>Confirm</p>

          <h2 :id="titleId" class="rd-title confirm-title">{{ request.title }}</h2>

          <p v-if="request.message" :id="bodyId" class="rd-body confirm-message">
            {{ request.message }}
          </p>

          <div class="confirm-actions">
            <button
              ref="cancelRef"
              type="button"
              class="rd-cta rd-cta--ghost"
              @click="resolveWith(false)"
            >
              {{ request.cancelLabel ?? 'Cancel' }}
            </button>
            <button
              type="button"
              class="rd-cta"
              :class="{ 'rd-cta--danger': request.tone === 'danger' }"
              @click="resolveWith(true)"
            >
              {{ request.confirmLabel ?? 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

import { activeConfirmRequest, resolveActiveConfirm } from '../../composables/useConfirm'

const request = activeConfirmRequest
const panelRef = ref<HTMLElement | null>(null)
const cancelRef = ref<HTMLButtonElement | null>(null)
const titleId = 'confirm-dialog-title'
const bodyId = 'confirm-dialog-body'

watch(request, async (value) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = value ? 'hidden' : ''

  if (value) {
    await nextTick()
    // Focus starts on Cancel so a stray Enter never confirms a destructive action.
    cancelRef.value?.focus()
  }
})

function resolveWith(confirmed: boolean) {
  resolveActiveConfirm(confirmed)
}

function trapFocus(event: KeyboardEvent) {
  const focusable = panelRef.value?.querySelectorAll<HTMLElement>('button:not([disabled])')
  if (!focusable?.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<style scoped>
.confirm-root {
  position: fixed;
  z-index: 200;
  display: grid;
  inset: 0;
  place-items: center;
  padding: 20px;
}

.confirm-scrim {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(3px);
  background: var(--rd-overlay);
}

.confirm-panel {
  position: relative;
  width: min(460px, 100%);
  border: 1px solid var(--rd-hairline);
  border-radius: var(--rd-radius-lg);
  background: var(--rd-surface);
  box-shadow: var(--rd-shadow-lg);
  padding: clamp(24px, 4vw, 34px);
}

.confirm-title {
  margin-top: 18px;
}

.confirm-message {
  margin: 14px 0 0;
}

.confirm-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}

.confirm-actions .rd-cta {
  flex: 1 1 auto;
}

@media (min-width: 520px) {
  .confirm-actions .rd-cta {
    flex: 0 0 auto;
  }
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 200ms ease;
}

.confirm-enter-active .confirm-panel,
.confirm-leave-active .confirm-panel {
  transition: transform 220ms cubic-bezier(0.33, 0, 0.2, 1);
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm-panel,
.confirm-leave-to .confirm-panel {
  transform: translateY(12px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .confirm-enter-active,
  .confirm-leave-active,
  .confirm-enter-active .confirm-panel,
  .confirm-leave-active .confirm-panel {
    transition: none;
  }
}
</style>
