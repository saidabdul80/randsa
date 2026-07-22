<template>
  <AppShell
    :show-header="false"
    :show-bottom-nav="false"
    content-class="min-h-full w-full"
  >
    <main
      class="auth-hub-page"
      :class="{ 'auth-theme-dark': resolvedTheme === 'dark' }"
    >
      <div class="auth-hub-shell">
        <aside class="auth-hub-brand" aria-labelledby="auth-hub-brand-title">
          <RouterLink to="/home" class="auth-hub-logo" aria-label="RANDSA home">
            <span aria-hidden="true">R</span>
            <strong>RANDSA</strong>
          </RouterLink>

          <div class="auth-hub-brand-copy">
            <p class="auth-hub-badge">Welcome</p>
            <h1 id="auth-hub-brand-title">Manage every rental<br>from one place.</h1>
            <p>Houses, apartments, offices, shops, cars, event spaces, horses, and much more.</p>
          </div>

          <ul class="auth-hub-features" aria-label="RANDSA platform features">
            <li><IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />Secure authentication</li>
            <li><IonIcon :icon="calendarClearOutline" aria-hidden="true" />Booking management</li>
            <li><IonIcon :icon="notificationsOutline" aria-hidden="true" />Real-time notifications</li>
            <li><IonIcon :icon="cardOutline" aria-hidden="true" />Payment checkout</li>
            <li><IonIcon :icon="gridOutline" aria-hidden="true" />Rental marketplace</li>
          </ul>

          <AuthFeaturedCarousel />
        </aside>

        <section class="auth-hub-workspace" aria-label="RANDSA authentication">
          <div class="auth-theme-toggle" role="group" aria-label="Authentication page theme">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              type="button"
              :class="{ 'auth-theme-toggle--active': themePreference === option.value }"
              :aria-pressed="themePreference === option.value"
              @click="setThemePreference(option.value)"
            >
              <IonIcon :icon="option.icon" aria-hidden="true" />
              {{ option.label }}
            </button>
          </div>

          <slot />

          <footer class="auth-hub-footer" aria-label="Authentication features">
            <span><IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />Firebase authentication</span>
            <span><IonIcon :icon="logoGoogle" aria-hidden="true" />Google sign-in</span>
            <span><IonIcon :icon="notificationsOutline" aria-hidden="true" />Booking updates</span>
            <span><IonIcon :icon="cardOutline" aria-hidden="true" />Paystack checkout</span>
          </footer>
        </section>
      </div>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  calendarClearOutline,
  cardOutline,
  gridOutline,
  logoGoogle,
  moonOutline,
  notificationsOutline,
  shieldCheckmarkOutline,
  sunnyOutline,
  contrastOutline,
} from 'ionicons/icons'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppShell from '../layout/AppShell.vue'
import AuthFeaturedCarousel from './AuthFeaturedCarousel.vue'

type AuthThemePreference = 'light' | 'dark' | 'system'

const AUTH_THEME_STORAGE_KEY = 'randsa-auth-theme'
const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: sunnyOutline },
  { value: 'dark' as const, label: 'Dark', icon: moonOutline },
  { value: 'system' as const, label: 'System', icon: contrastOutline },
]
const themePreference = ref<AuthThemePreference>('system')
const systemPrefersDark = ref(false)
const resolvedTheme = computed(() =>
  themePreference.value === 'system'
    ? systemPrefersDark.value ? 'dark' : 'light'
    : themePreference.value,
)

let systemThemeQuery: MediaQueryList | null = null

function syncSystemTheme() {
  systemPrefersDark.value = Boolean(systemThemeQuery?.matches)
}

function setThemePreference(preference: AuthThemePreference) {
  themePreference.value = preference

  try {
    window.localStorage.setItem(AUTH_THEME_STORAGE_KEY, preference)
  } catch {
    // The selected theme still applies for this page when storage is unavailable.
  }
}

onMounted(() => {
  systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  syncSystemTheme()
  systemThemeQuery.addEventListener('change', syncSystemTheme)

  try {
    const storedPreference = window.localStorage.getItem(AUTH_THEME_STORAGE_KEY)
    if (storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system') {
      themePreference.value = storedPreference
    }
  } catch {
    // System theme remains the default when storage is unavailable.
  }
})

onBeforeUnmount(() => {
  systemThemeQuery?.removeEventListener('change', syncSystemTheme)
})
</script>

<style scoped>
.auth-hub-page {
  --auth-page-bg: #f4f7fb;
  --auth-surface: #ffffff;
  --auth-panel: #f1f7ff;
  --auth-text: #102033;
  --auth-muted: #66758a;
  --auth-subtle: #8b98a9;
  --auth-border: #dfe6ee;
  --auth-input: #ffffff;
  --auth-blue: #1769df;
  --auth-blue-dark: #1057bf;
  --auth-focus-border: #67a5ef;
  --auth-focus: rgba(31, 111, 231, 0.16);
  --auth-icon: #748399;
  --auth-placeholder: #8b98a9;
  --auth-hover: #edf4fc;
  --auth-info-border: #bedaf8;
  --auth-info-bg: #f0f7ff;
  --auth-info-text: #205f9f;
  --auth-warning-border: #f3d49a;
  --auth-warning-bg: #fff9eb;
  --auth-warning-text: #8a5a0a;
  --auth-error-border: #f7bdc7;
  --auth-error-bg: #fff1f3;
  --auth-error-text: #b72143;
  --auth-success-border: #b8e5cd;
  --auth-success-bg: #effaf4;
  --auth-success-text: #14734a;
  min-height: 100%;
  overflow-x: hidden;
  background: var(--auth-page-bg);
  padding: 22px;
}

.auth-hub-shell {
  display: grid;
  width: min(1460px, 100%);
  min-height: calc(100vh - 44px);
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid var(--auth-border);
  border-radius: 20px;
  background: var(--auth-surface);
  box-shadow: 0 26px 68px -46px rgba(16, 32, 51, 0.52);
}

.auth-hub-brand {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  background: var(--auth-panel);
  padding: 38px 42px 0;
  color: var(--auth-text);
}

.auth-hub-logo {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 13px;
  color: var(--auth-text);
  text-decoration: none;
}

.auth-hub-logo span {
  color: var(--auth-blue);
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 46px;
  font-weight: 850;
  line-height: 1;
}

.auth-hub-logo strong {
  font-size: 20px;
  font-weight: 850;
}

.auth-hub-brand-copy {
  margin-top: 42px;
}

.auth-hub-badge {
  display: inline-flex;
  min-height: 29px;
  align-items: center;
  border: 1px solid #c7dcf7;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.68);
  padding: 0 13px;
  color: var(--auth-blue);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.auth-hub-brand-copy h1 {
  margin: 19px 0 0;
  color: var(--auth-text);
  font-family: 'Space Grotesk', 'Manrope', sans-serif;
  font-size: 40px;
  font-weight: 850;
  letter-spacing: 0;
  line-height: 1.08;
}

.auth-hub-brand-copy > p:last-child {
  max-width: 430px;
  margin: 16px 0 0;
  color: var(--auth-muted);
  font-size: 12px;
  line-height: 1.7;
}

.auth-hub-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 25px 0 24px;
  padding: 0;
  list-style: none;
}

.auth-hub-features li {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 7px;
  border: 1px solid rgba(123, 166, 216, 0.18);
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.7);
  padding: 0 11px;
  color: #3d526a;
  font-size: 9px;
  font-weight: 750;
}

.auth-hub-features ion-icon {
  color: var(--auth-blue);
  font-size: 14px;
}

.auth-hub-workspace {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--auth-surface);
  padding: 36px clamp(24px, 5vw, 82px) 26px;
}

.auth-theme-toggle {
  position: absolute;
  z-index: 2;
  top: 18px;
  right: 22px;
  display: flex;
  gap: 3px;
  border: 1px solid var(--auth-border);
  border-radius: 11px;
  background: var(--auth-hover);
  padding: 3px;
}

.auth-theme-toggle button {
  display: inline-flex;
  min-height: 31px;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 0 9px;
  color: var(--auth-muted);
  font-size: 9px;
  font-weight: 750;
  cursor: pointer;
  transition: background-color 190ms ease, color 190ms ease, box-shadow 190ms ease;
}

.auth-theme-toggle button:hover {
  color: var(--auth-blue);
}

.auth-theme-toggle .auth-theme-toggle--active {
  background: var(--auth-surface);
  color: var(--auth-blue);
  box-shadow: 0 7px 16px -13px rgba(16, 32, 51, 0.8);
}

.auth-theme-toggle ion-icon {
  font-size: 14px;
}

.auth-theme-toggle button:focus-visible {
  outline: 3px solid var(--auth-focus);
  outline-offset: 2px;
}

.auth-hub-footer {
  display: grid;
  width: min(680px, 100%);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 22px;
}

.auth-hub-footer span {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--auth-muted);
  font-size: 8px;
  font-weight: 700;
  white-space: nowrap;
}

.auth-hub-footer ion-icon {
  flex: 0 0 auto;
  color: #667d98;
  font-size: 14px;
}

.auth-hub-logo:focus-visible {
  outline: 3px solid var(--auth-focus);
  outline-offset: 3px;
}

@media (min-width: 1024px) {
  .auth-hub-page {
    height: 100dvh;
    min-height: 0;
    overflow: hidden;
  }

  .auth-hub-shell {
    height: calc(100dvh - 44px);
    min-height: 0;
    grid-template-columns: minmax(390px, 0.7fr) minmax(600px, 1fr);
  }

  .auth-hub-brand {
    height: 100%;
    min-height: 0;
  }

  .auth-hub-workspace {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
}

@media (min-width: 1024px) and (max-height: 760px) {
  .auth-hub-page { padding: 12px 16px; }
  .auth-hub-shell { height: calc(100dvh - 24px); }
  .auth-hub-brand { padding: 20px 30px 0; }
  .auth-hub-logo { gap: 10px; }
  .auth-hub-logo span { font-size: 38px; }
  .auth-hub-logo strong { font-size: 18px; }
  .auth-hub-brand-copy { margin-top: 22px; }
  .auth-hub-badge { min-height: 25px; padding-inline: 11px; font-size: 8px; }
  .auth-hub-brand-copy h1 { margin-top: 12px; font-size: 34px; line-height: 1.04; }
  .auth-hub-brand-copy > p:last-child { margin-top: 10px; font-size: 10px; line-height: 1.5; }
  .auth-hub-features { gap: 6px; margin: 14px 0 12px; }
  .auth-hub-features li { min-height: 29px; padding-inline: 9px; font-size: 8px; }
  .auth-hub-workspace { padding: 44px 30px 12px; }
  .auth-theme-toggle { top: 10px; right: 14px; }
  .auth-theme-toggle button { min-height: 27px; padding-inline: 7px; font-size: 8px; }
  .auth-hub-footer { display: none; }

  .auth-hub-brand :deep(.auth-featured-carousel) {
    width: calc(100% + 60px);
    height: 190px;
    flex-basis: 190px;
    margin-right: -30px;
    margin-left: -30px;
  }
}

@media (max-width: 1120px) and (min-width: 1024px) {
  .auth-hub-brand { padding-right: 30px; padding-left: 30px; }
  .auth-hub-brand-copy h1 { font-size: 35px; }
  .auth-hub-workspace { padding-right: 30px; padding-left: 30px; }
}

@media (max-width: 1023px) {
  .auth-hub-page { padding: 18px; }
  .auth-hub-shell { min-height: auto; }
  .auth-hub-brand { min-height: 630px; padding: 34px 40px 0; }
  .auth-hub-brand-copy { margin-top: 35px; }
  .auth-hub-workspace { padding: 24px 28px 30px; }
  .auth-theme-toggle { position: static; align-self: flex-end; margin-bottom: 14px; }
}

@media (max-width: 680px) {
  .auth-hub-page { padding: 0; }
  .auth-hub-shell { border: 0; border-radius: 0; box-shadow: none; }
  .auth-hub-brand { min-height: auto; padding: 26px 20px 0; }
  .auth-hub-logo span { font-size: 39px; }
  .auth-hub-logo strong { font-size: 18px; }
  .auth-hub-brand-copy { margin-top: 29px; }
  .auth-hub-brand-copy h1 { margin-top: 15px; font-size: 32px; }
  .auth-hub-brand-copy > p:last-child { margin-top: 12px; font-size: 11px; }
  .auth-hub-features { gap: 6px; margin: 20px 0; }
  .auth-hub-features li { min-height: 31px; padding: 0 9px; font-size: 8px; }
  .auth-hub-workspace { justify-content: flex-start; padding: 28px 14px 26px; }
  .auth-hub-footer { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .auth-hub-footer span { justify-content: flex-start; }
}

:global(.dark) .auth-hub-page,
.auth-hub-page.auth-theme-dark {
  --auth-page-bg: #0b1320;
  --auth-surface: #111b28;
  --auth-panel: #132233;
  --auth-text: #f4f7fb;
  --auth-muted: #b2bfd0;
  --auth-subtle: #8494a8;
  --auth-border: #2a3849;
  --auth-input: #0e1825;
  --auth-blue: #62a3f4;
  --auth-blue-dark: #4a91eb;
  --auth-focus-border: #62a3f4;
  --auth-focus: rgba(98, 163, 244, 0.18);
  --auth-icon: #8fa1b7;
  --auth-placeholder: #8998aa;
  --auth-hover: #172739;
  --auth-info-border: #315477;
  --auth-info-bg: #132a42;
  --auth-info-text: #b7d8fb;
  --auth-warning-border: #725926;
  --auth-warning-bg: #2e2618;
  --auth-warning-text: #f2d38f;
  --auth-error-border: #743645;
  --auth-error-bg: #321d25;
  --auth-error-text: #ffb7c5;
  --auth-success-border: #2f6249;
  --auth-success-bg: #183126;
  --auth-success-text: #a8e5c5;
}

:global(.dark) .auth-hub-badge,
:global(.dark) .auth-hub-features li,
.auth-theme-dark .auth-hub-badge,
.auth-theme-dark .auth-hub-features li {
  border-color: #314962;
  background: rgba(17, 27, 40, 0.76);
  color: #c6d2df;
}
</style>
