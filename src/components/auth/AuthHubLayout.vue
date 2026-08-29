<template>
  <AppShell :show-header="false" :show-bottom-nav="false" content-class="min-h-full w-full">
    <main class="auth-scene" :class="{ 'auth-theme-dark': resolvedTheme === 'dark' }">
      <header class="auth-scene-top">
        <RouterLink to="/home" class="auth-wordmark" aria-label="RANDSA home">
          <span class="auth-wordmark-monogram" aria-hidden="true">R</span>
          <span class="auth-wordmark-text">RANDSA</span>
        </RouterLink>

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
            <span>{{ option.label }}</span>
          </button>
        </div>
      </header>

      <div class="auth-scene-body">
        <figure class="auth-plate">
          <img
            v-for="(slide, index) in slides"
            :key="slide.id"
            :src="slide.image"
            alt=""
            class="auth-plate-photo"
            :class="{ 'auth-plate-photo--active': index === activeSlideIndex }"
            :loading="index === 0 ? 'eager' : 'lazy'"
            :fetchpriority="index === 0 ? 'high' : 'low'"
            decoding="async"
          />
          <span class="auth-plate-veil" aria-hidden="true"></span>

          <figcaption class="auth-plate-caption" aria-live="polite">
            <p class="auth-plate-meta">
              <span class="auth-plate-index">{{ slideCounter }}</span>
              <span class="auth-plate-rule" aria-hidden="true"></span>
              <span class="auth-plate-eyebrow">{{ activeSlide.eyebrow }}</span>
            </p>
            <h1>{{ activeSlide.title }}</h1>
            <p class="auth-plate-copy">{{ activeSlide.copy }}</p>
          </figcaption>

          <div class="auth-plate-ticks" role="tablist" aria-label="Featured rental categories">
            <button
              v-for="(slide, index) in slides"
              :key="slide.id"
              type="button"
              role="tab"
              :class="{ 'auth-plate-tick--active': index === activeSlideIndex }"
              :aria-selected="index === activeSlideIndex"
              :aria-label="slide.eyebrow"
              @click="selectSlide(index)"
            />
          </div>
        </figure>

        <div class="auth-scene-form">
          <slot />
        </div>
      </div>

      <footer class="auth-scene-foot">
        <span>Secure Firebase authentication</span>
        <span class="auth-foot-dot" aria-hidden="true">&middot;</span>
        <span>Paystack checkout</span>
        <span class="auth-foot-dot" aria-hidden="true">&middot;</span>
        <span>Rentals across every category</span>
      </footer>
    </main>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { contrastOutline, moonOutline, sunnyOutline } from 'ionicons/icons'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import heroCarImage from '../../assets/randsa-hero-car.webp'
import heroEventImage from '../../assets/randsa-hero-event.webp'
import heroHomeImage from '../../assets/randsa-hero-home.webp'
import heroHorsesImage from '../../assets/randsa-hero-horses.webp'
import { useTheme } from '../../composables/useTheme'
import AppShell from '../layout/AppShell.vue'

const SLIDE_INTERVAL_MS = 7000

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: sunnyOutline },
  { value: 'dark' as const, label: 'Dark', icon: moonOutline },
  { value: 'system' as const, label: 'System', icon: contrastOutline },
]

const slides = [
  {
    id: 'home',
    image: heroHomeImage,
    eyebrow: 'Homes and apartments',
    title: 'Because a stay should feel like a destination.',
    copy: 'Verified homes, apartments, offices, and shops, ready when you are.',
  },
  {
    id: 'car',
    image: heroCarImage,
    eyebrow: 'Cars and rides',
    title: 'Every journey deserves the right arrival.',
    copy: 'Rent by the day with transparent pricing and confirmed availability.',
  },
  {
    id: 'event',
    image: heroEventImage,
    eyebrow: 'Event spaces',
    title: 'Spaces that make the occasion.',
    copy: 'Reserve halls and venues with real-time booking and instant confirmation.',
  },
  {
    id: 'horses',
    image: heroHorsesImage,
    eyebrow: 'Horses and more',
    title: 'One address for every category.',
    copy: 'From land and fashion to electronics and horses, list it or book it here.',
  },
]

// The auth pages drive the same app-wide theme as every other screen.
const { themePreference, resolvedTheme, setThemePreference } = useTheme()

const activeSlideIndex = ref(0)
const activeSlide = computed(() => slides[activeSlideIndex.value])
const slideCounter = computed(
  () =>
    `${String(activeSlideIndex.value + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`
)
let reducedMotionQuery: MediaQueryList | null = null
let slideTimer: number | null = null

function stopSlideRotation() {
  if (slideTimer !== null) {
    window.clearInterval(slideTimer)
    slideTimer = null
  }
}

function startSlideRotation() {
  stopSlideRotation()

  if (reducedMotionQuery?.matches) {
    return
  }

  slideTimer = window.setInterval(() => {
    activeSlideIndex.value = (activeSlideIndex.value + 1) % slides.length
  }, SLIDE_INTERVAL_MS)
}

function selectSlide(index: number) {
  activeSlideIndex.value = index
  // Restart the timer so a manual pick gets a full interval before it moves on.
  startSlideRotation()
}

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotionQuery.addEventListener('change', startSlideRotation)
  startSlideRotation()
})

onBeforeUnmount(() => {
  reducedMotionQuery?.removeEventListener('change', startSlideRotation)
  stopSlideRotation()
})
</script>

<style scoped>
.auth-scene {
  /* Warm ivory canvas, ink type, and a single brass accent. The --auth-* names are the
     contract shared with AuthField, AuthAlert, and AuthHub. */
  --auth-canvas: var(--rd-canvas);
  --auth-surface: var(--rd-surface);
  --auth-panel: var(--rd-surface);
  --auth-text: var(--rd-ink);
  --auth-muted: var(--rd-muted);
  --auth-subtle: var(--rd-subtle);
  --auth-border: var(--rd-hairline);
  --auth-hairline: var(--rd-hairline);
  --auth-input: var(--rd-surface-sunken);
  --auth-blue: var(--rd-brass);
  --auth-blue-dark: var(--rd-brass-strong);
  --auth-focus-border: var(--rd-brass-ring);
  --auth-focus: var(--rd-brass-soft);
  --auth-icon: var(--rd-subtle);
  --auth-placeholder: var(--rd-subtle);
  --auth-hover: var(--rd-surface-sunken);
  --auth-primary-bg: var(--rd-primary-bg);
  --auth-primary-bg-hover: var(--rd-primary-bg-hover);
  --auth-primary-text: var(--rd-primary-text);
  --auth-info-border: var(--rd-info-border);
  --auth-info-bg: var(--rd-info-bg);
  --auth-info-text: var(--rd-info);
  --auth-warning-border: var(--rd-warning-border);
  --auth-warning-bg: var(--rd-warning-bg);
  --auth-warning-text: var(--rd-warning);
  --auth-error-border: var(--rd-danger-border);
  --auth-error-bg: var(--rd-danger-bg);
  --auth-error-text: var(--rd-danger);
  --auth-success-border: var(--rd-success-border);
  --auth-success-bg: var(--rd-success-bg);
  --auth-success-text: var(--rd-success);
  position: relative;
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  gap: clamp(18px, 3vh, 30px);
  background: var(--auth-canvas);
  padding: clamp(20px, 3vw, 38px);
  color: var(--auth-text);
}

/* ---------- top bar ---------- */

.auth-scene-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.auth-wordmark {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--auth-text);
  text-decoration: none;
}

.auth-wordmark-monogram {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--auth-blue);
  border-radius: 3px;
  color: var(--auth-blue);
  font-family: 'Fraunces', 'Space Grotesk', serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
}

.auth-wordmark-text {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.34em;
}

.auth-theme-toggle {
  display: flex;
  gap: 2px;
  border: 1px solid var(--auth-hairline);
  border-radius: 3px;
  padding: 3px;
}

.auth-theme-toggle button {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  padding: 0 12px;
  color: var(--auth-subtle);
  font-family: inherit;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color 220ms ease,
    color 220ms ease;
}

.auth-theme-toggle button:hover {
  color: var(--auth-text);
}

.auth-theme-toggle .auth-theme-toggle--active {
  background: var(--auth-hover);
  color: var(--auth-text);
}

.auth-theme-toggle ion-icon {
  font-size: 14px;
}

.auth-theme-toggle button:focus-visible,
.auth-wordmark:focus-visible {
  outline: 2px solid var(--auth-focus-border);
  outline-offset: 4px;
}

/* ---------- body ---------- */

.auth-scene-body {
  display: grid;
  width: min(1460px, 100%);
  flex: 1 1 auto;
  align-items: stretch;
  gap: clamp(28px, 4.5vw, 76px);
  margin: 0 auto;
  grid-template-columns: minmax(0, 1.06fr) minmax(390px, 500px);
}

/* ---------- framed plate ---------- */

.auth-plate {
  position: relative;
  display: flex;
  min-height: 460px;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
  border-radius: 6px;
  margin: 0;
  background: #0b0e13;
  padding: clamp(28px, 3vw, 52px);
}

.auth-plate-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scale(1.04);
  opacity: 0;
  object-fit: cover;
  transition: opacity 1600ms cubic-bezier(0.33, 0, 0.2, 1);
}

.auth-plate-photo--active {
  opacity: 1;
  animation: auth-plate-drift 22s ease-out forwards;
}

@keyframes auth-plate-drift {
  from {
    transform: scale(1.04);
  }
  to {
    transform: scale(1.13);
  }
}

.auth-plate-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(7, 10, 15, 0.88) 4%, rgba(7, 10, 15, 0.24) 46%, transparent 72%),
    linear-gradient(to right, rgba(7, 10, 15, 0.42), transparent 58%);
}

.auth-plate-caption {
  position: relative;
  max-width: 520px;
}

.auth-plate-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 20px;
}

.auth-plate-index {
  color: rgba(246, 243, 238, 0.66);
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.16em;
}

.auth-plate-rule {
  width: 40px;
  height: 1px;
  background: rgba(201, 169, 106, 0.85);
}

.auth-plate-eyebrow {
  color: #c9a96a;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.auth-plate-caption h1 {
  margin: 0;
  color: #f8f5f0;
  font-family: 'Fraunces', 'Space Grotesk', serif;
  font-size: clamp(30px, 3.1vw, 52px);
  font-weight: 400;
  letter-spacing: -0.015em;
  line-height: 1.08;
  text-wrap: balance;
}

.auth-plate-copy {
  max-width: 420px;
  margin: 20px 0 0;
  color: rgba(240, 236, 229, 0.74);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.78;
}

.auth-plate-ticks {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 34px;
}

.auth-plate-ticks button {
  width: 26px;
  height: 2px;
  border: 0;
  border-radius: 0;
  background: rgba(246, 243, 238, 0.3);
  padding: 0;
  cursor: pointer;
  transition:
    width 420ms cubic-bezier(0.33, 0, 0.2, 1),
    background-color 420ms ease;
}

.auth-plate-ticks button:hover {
  background: rgba(246, 243, 238, 0.62);
}

.auth-plate-ticks .auth-plate-tick--active {
  width: 54px;
  background: #c9a96a;
}

.auth-plate-ticks button:focus-visible {
  outline: 2px solid rgba(201, 169, 106, 0.85);
  outline-offset: 6px;
}

/* ---------- form column ---------- */

.auth-scene-form {
  display: flex;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
}

/* ---------- foot ---------- */

.auth-scene-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  color: var(--auth-subtle);
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.auth-foot-dot {
  color: var(--auth-blue);
}

/* ---------- responsive ---------- */

@media (max-width: 1080px) {
  .auth-scene-body {
    gap: 26px;
    grid-template-columns: minmax(0, 1fr);
  }

  .auth-plate {
    min-height: 0;
    aspect-ratio: 16 / 9;
    padding: 28px;
  }

  .auth-plate-caption h1 {
    font-size: clamp(24px, 4.4vw, 38px);
  }

  .auth-plate-copy {
    display: none;
  }

  .auth-plate-ticks {
    margin-top: 22px;
  }

  .auth-scene-form {
    width: min(560px, 100%);
    margin: 0 auto;
  }
}

@media (max-width: 680px) {
  .auth-scene {
    gap: 16px;
    padding: 16px;
  }

  /* On phones the plate stops being a banner above the form and becomes the page
     backdrop, with the form sitting on top of it. */
  .auth-plate {
    position: absolute;
    z-index: 0;
    inset: 0;
    min-height: 0;
    aspect-ratio: auto;
    border-radius: 0;
    padding: 0;
  }

  .auth-plate-caption,
  .auth-plate-ticks {
    display: none;
  }

  .auth-plate-veil {
    background: linear-gradient(180deg, rgba(7, 10, 15, 0.66) 0%, rgba(7, 10, 15, 0.86) 100%);
  }

  /* The plate is positioned, so it paints above ordinary block content. The header and
     the form therefore need their own positioned layer to sit on top of it.
     .auth-scene-body must stay unpositioned so the plate's inset resolves against
     .auth-scene and covers the full page. */
  .auth-scene-top,
  .auth-scene-form {
    position: relative;
    z-index: 1;
  }

  .auth-scene-top {
    justify-content: space-between;
  }

  /* The top bar now sits over the photo, so it needs light-on-dark treatment
     regardless of which theme is active. */
  .auth-wordmark {
    color: #f8f5f0;
  }

  .auth-wordmark-text {
    font-size: 11px;
    letter-spacing: 0.28em;
  }

  .auth-wordmark-monogram {
    border-color: #c9a96a;
    color: #c9a96a;
  }

  .auth-theme-toggle {
    border-color: rgba(248, 245, 240, 0.26);
    background: rgba(11, 14, 19, 0.44);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
  }

  .auth-theme-toggle button {
    padding: 0 10px;
    color: rgba(248, 245, 240, 0.74);
  }

  .auth-theme-toggle button span {
    display: none;
  }

  .auth-theme-toggle button:hover {
    color: #ffffff;
  }

  .auth-theme-toggle .auth-theme-toggle--active {
    background: rgba(248, 245, 240, 0.92);
    color: #10141b;
  }

  .auth-scene-foot {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-plate-photo,
  .auth-plate-photo--active {
    animation: none;
    transition: none;
  }

  .auth-theme-toggle button,
  .auth-plate-ticks button {
    transition: none;
  }
}

/* ---------- dark theme ---------- */
</style>
