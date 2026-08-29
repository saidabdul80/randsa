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

/* A filled field closed by a single hairline. The line, not a box, carries focus. */
.auth-input-wrap {
  position: relative;
  display: flex;
  width: 100%;
  height: 58px;
  align-items: center;
  gap: 12px;
  border: 0;
  border-bottom: 1px solid var(--auth-border);
  border-radius: 3px 3px 0 0;
  background: var(--auth-input);
  padding: 0 14px;
  transition:
    border-color 240ms ease,
    background-color 240ms ease,
    box-shadow 240ms ease;
}

.auth-input-wrap:focus-within {
  border-bottom-color: var(--auth-blue);
  background: var(--auth-hover);
  /* Thickens the hairline to 2px without shifting the field's height. */
  box-shadow: inset 0 -1px 0 var(--auth-blue);
}

.auth-input-wrap > ion-icon {
  flex: 0 0 auto;
  color: var(--auth-icon);
  font-size: 17px;
  transition: color 240ms ease;
}

.auth-input-wrap:focus-within > ion-icon {
  color: var(--auth-blue);
}

.auth-input-wrap input {
  min-width: 0;
  height: 100%;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 18px 0 0;
  color: var(--auth-text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 550;
  letter-spacing: 0.01em;
}

.auth-input-wrap input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Chrome paints autofilled fields with its own rgb(232, 240, 254) highlight, which is
   unreadable on a dark card. Clipping that background to the glyphs hides it without
   forcing an opaque colour, so the field keeps its translucent surface. */
.auth-input-wrap input:-webkit-autofill,
.auth-input-wrap input:-webkit-autofill:hover,
.auth-input-wrap input:-webkit-autofill:focus,
.auth-input-wrap input:-webkit-autofill:active {
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: var(--auth-text);
  caret-color: var(--auth-text);
  transition:
    background-color 600000s 0s,
    color 600000s 0s;
}

.auth-floating-label {
  position: absolute;
  left: 43px;
  top: 50%;
  overflow: hidden;
  max-width: calc(100% - 60px);
  transform: translateY(-50%);
  color: var(--auth-placeholder);
  font-size: 12px;
  font-weight: 550;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  transition:
    top 240ms cubic-bezier(0.33, 0, 0.2, 1),
    transform 240ms cubic-bezier(0.33, 0, 0.2, 1),
    color 240ms ease,
    font-size 240ms ease,
    letter-spacing 240ms ease;
}

.auth-input-wrap input:focus + .auth-floating-label,
.auth-input-wrap input:not(:placeholder-shown) + .auth-floating-label {
  top: 13px;
  transform: none;
  color: var(--auth-subtle);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.auth-input-wrap input:focus + .auth-floating-label {
  color: var(--auth-blue);
}

.auth-password-toggle {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--auth-icon);
  font-size: 17px;
  cursor: pointer;
  transition:
    background-color 240ms ease,
    color 240ms ease;
}

.auth-password-toggle:hover {
  background: var(--auth-hover);
  color: var(--auth-text);
}

.auth-password-toggle:focus-visible {
  outline: 2px solid var(--auth-focus-border);
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
