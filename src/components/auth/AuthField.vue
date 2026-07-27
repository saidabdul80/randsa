<template>
  <label class="auth-field">
    <span class="auth-input-wrap">
      <IonIcon :icon="icon" aria-hidden="true" />
      <input
        :value="modelValue"
        :name="name"
        :type="resolvedType"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :disabled="disabled"
        :required="required"
        placeholder=" "
        :aria-describedby="describedby"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span class="auth-floating-label">{{ label }}</span>
      <button
        v-if="type === 'password'"
        type="button"
        class="auth-password-toggle"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
        :aria-pressed="showPassword"
        :disabled="disabled"
        @click="showPassword = !showPassword"
      >
        <IonIcon :icon="showPassword ? eyeOffOutline : eyeOutline" aria-hidden="true" />
      </button>
    </span>
  </label>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { eyeOffOutline, eyeOutline } from 'ionicons/icons'
import { computed, ref } from 'vue'

defineEmits<{
  'update:modelValue': [value: string]
}>()

const props = withDefaults(
  defineProps<{
    modelValue: string
    label: string
    icon: string
    type?: 'text' | 'email' | 'tel' | 'password'
    name?: string
    autocomplete?: string
    inputmode?: 'text' | 'email' | 'tel'
    disabled?: boolean
    required?: boolean
    describedby?: string
  }>(),
  {
    type: 'text',
    name: undefined,
    autocomplete: 'off',
    inputmode: 'text',
    disabled: false,
    required: false,
    describedby: undefined,
  }
)

const showPassword = ref(false)
const resolvedType = computed(() =>
  props.type === 'password' && showPassword.value ? 'text' : props.type
)
</script>

<style scoped>
.auth-field {
  display: block;
  min-width: 0;
}

.auth-input-wrap {
  position: relative;
  display: flex;
  width: 100%;
  height: 54px;
  align-items: center;
  gap: 11px;
  border: 1px solid var(--auth-border);
  border-radius: 12px;
  background: var(--auth-input);
  padding: 0 14px;
  transition:
    border-color 190ms ease,
    box-shadow 190ms ease,
    transform 190ms ease;
}

.auth-input-wrap:focus-within {
  border-color: var(--auth-focus-border);
  box-shadow: 0 0 0 4px var(--auth-focus);
  transform: translateY(-1px);
}

.auth-input-wrap > ion-icon {
  flex: 0 0 auto;
  color: var(--auth-icon);
  font-size: 19px;
  transition:
    color 190ms ease,
    transform 190ms ease;
}

.auth-input-wrap:focus-within > ion-icon {
  transform: translateY(-1px);
  color: var(--auth-blue);
}

.auth-input-wrap input {
  min-width: 0;
  height: 100%;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 15px 0 0;
  color: var(--auth-text);
  font-family: inherit;
  font-size: 12px;
}

.auth-input-wrap input:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.auth-floating-label {
  position: absolute;
  left: 44px;
  top: 50%;
  overflow: hidden;
  max-width: calc(100% - 58px);
  transform: translateY(-50%);
  color: var(--auth-placeholder);
  font-size: 12px;
  font-weight: 650;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  transition:
    top 180ms ease,
    transform 180ms ease,
    color 180ms ease,
    font-size 180ms ease;
}

.auth-input-wrap input:focus + .auth-floating-label,
.auth-input-wrap input:not(:placeholder-shown) + .auth-floating-label {
  top: 11px;
  transform: none;
  color: var(--auth-blue);
  font-size: 8px;
  font-weight: 800;
}

.auth-password-toggle {
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--auth-icon);
  font-size: 19px;
  cursor: pointer;
  transition:
    background-color 190ms ease,
    color 190ms ease;
}

.auth-password-toggle:hover {
  background: var(--auth-hover);
  color: var(--auth-blue);
}

.auth-password-toggle:focus-visible {
  outline: 3px solid var(--auth-focus);
  outline-offset: 2px;
}

.auth-password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (prefers-reduced-motion: reduce) {
  .auth-input-wrap,
  .auth-input-wrap > ion-icon,
  .auth-floating-label,
  .auth-password-toggle {
    transition: none;
  }
}
</style>
