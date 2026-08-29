<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="label"
    :title="label"
    @click="cycleThemePreference"
  >
    <IonIcon :icon="icon" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { contrastOutline, moonOutline, sunnyOutline } from 'ionicons/icons'
import { computed } from 'vue'

import { type ThemePreference, useTheme } from '../../composables/useTheme'

const { themePreference, setThemePreference } = useTheme()

const order: ThemePreference[] = ['system', 'light', 'dark']
const icons: Record<ThemePreference, string> = {
  system: contrastOutline,
  light: sunnyOutline,
  dark: moonOutline,
}
const names: Record<ThemePreference, string> = {
  system: 'following your device',
  light: 'light',
  dark: 'dark',
}

const icon = computed(() => icons[themePreference.value])
const nextPreference = computed(
  () => order[(order.indexOf(themePreference.value) + 1) % order.length]
)
const label = computed(
  () => `Theme: ${names[themePreference.value]}. Switch to ${names[nextPreference.value]}.`
)

function cycleThemePreference() {
  setThemePreference(nextPreference.value)
}
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rd-border);
  border-radius: 999px;
  background: transparent;
  color: var(--rd-muted);
  font-size: 19px;
  cursor: pointer;
  transition:
    border-color 240ms ease,
    color 240ms ease,
    background-color 240ms ease;
}

.theme-toggle:hover {
  border-color: var(--rd-brass);
  background: var(--rd-brass-soft);
  color: var(--rd-brass);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--rd-brass);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle {
    transition: none;
  }
}
</style>
