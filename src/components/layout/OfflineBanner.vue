<template>
  <Transition name="offline">
    <div v-if="isOffline" class="offline-banner" role="status" aria-live="polite">
      <IonIcon :icon="cloudOfflineOutline" aria-hidden="true" />
      <span
        >You are offline. Saved pages still work; new listings will load when you reconnect.</span
      >
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { cloudOfflineOutline } from 'ionicons/icons'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const isOffline = ref(false)

function sync() {
  isOffline.value = typeof navigator !== 'undefined' && navigator.onLine === false
}

onMounted(() => {
  sync()
  window.addEventListener('online', sync)
  window.addEventListener('offline', sync)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', sync)
  window.removeEventListener('offline', sync)
})
</script>

<style scoped>
.offline-banner {
  position: sticky;
  z-index: 80;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: var(--rd-warning-bg);
  border-bottom: 1px solid var(--rd-warning-border);
  padding: 10px 16px;
  color: var(--rd-warning);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.offline-banner ion-icon {
  flex: 0 0 auto;
  font-size: 16px;
}

.offline-enter-active,
.offline-leave-active {
  transition: opacity 200ms ease;
}

.offline-enter-from,
.offline-leave-to {
  opacity: 0;
}
</style>
