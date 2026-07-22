<template>
  <div class="auth-alert" :class="`auth-alert--${tone}`">
    <IonIcon :icon="toneIcon" aria-hidden="true" />
    <span><slot /></span>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  warningOutline,
} from 'ionicons/icons'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: 'info' | 'warning' | 'error' | 'success'
  }>(),
  {
    tone: 'info',
  },
)

const toneIcon = computed(() => ({
  info: informationCircleOutline,
  warning: warningOutline,
  error: alertCircleOutline,
  success: checkmarkCircleOutline,
})[props.tone])
</script>

<style scoped>
.auth-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid;
  border-radius: 11px;
  padding: 11px 13px;
  font-size: 10px;
  font-weight: 650;
  line-height: 1.55;
}

.auth-alert ion-icon {
  margin-top: 1px;
  flex: 0 0 auto;
  font-size: 17px;
}

.auth-alert--info {
  border-color: var(--auth-info-border, #bedaf8);
  background: var(--auth-info-bg, #f0f7ff);
  color: var(--auth-info-text, #205f9f);
}

.auth-alert--warning {
  border-color: var(--auth-warning-border, #f3d49a);
  background: var(--auth-warning-bg, #fff9eb);
  color: var(--auth-warning-text, #8a5a0a);
}

.auth-alert--error {
  border-color: var(--auth-error-border, #f7bdc7);
  background: var(--auth-error-bg, #fff1f3);
  color: var(--auth-error-text, #b72143);
}

.auth-alert--success {
  border-color: var(--auth-success-border, #b8e5cd);
  background: var(--auth-success-bg, #effaf4);
  color: var(--auth-success-text, #14734a);
}
</style>
