<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-shell">
      <a class="rd-skip-link" href="#main-content">Skip to content</a>

      <OfflineBanner />

      <AppHeader v-if="showHeader" :floating="floatingHeader" :unread-count="unreadCount" />

      <!-- Optional editorial page title block, shared by every inner page. -->
      <div v-if="title" class="app-shell__masthead">
        <div class="app-shell__masthead-inner">
          <p v-if="eyebrow" class="rd-eyebrow">
            <span class="rd-rule" aria-hidden="true"></span>{{ eyebrow }}
          </p>
          <h1 class="rd-display app-shell__title">{{ title }}</h1>
          <p v-if="description" class="rd-lede app-shell__description">{{ description }}</p>
          <div v-if="$slots.headerAction" class="app-shell__masthead-actions">
            <slot name="headerAction" />
          </div>
        </div>
      </div>

      <main id="main-content" :class="contentClass">
        <slot />
      </main>
    </ion-content>

    <AppBottomNav v-if="showBottomNav" />
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'

import AppBottomNav from '../navigation/AppBottomNav.vue'
import AppHeader from './AppHeader.vue'
import OfflineBanner from './OfflineBanner.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    eyebrow?: string
    /** Header sits transparently over a full-bleed hero until scrolled. */
    floatingHeader?: boolean
    unreadCount?: number
    showBottomNav?: boolean
    showHeader?: boolean
    contentClass?: string
  }>(),
  {
    title: '',
    description: '',
    eyebrow: '',
    floatingHeader: false,
    unreadCount: 0,
    // Both default to true: a page has to opt OUT of navigation, never accidentally
    // ship without it. This is what left mobile users stranded on the old home page.
    showBottomNav: true,
    showHeader: true,
    contentClass: 'app-shell__content',
  }
)
</script>

<style scoped>
.app-shell {
  --background: var(--rd-canvas);
  color: var(--rd-ink);
}

.app-shell__masthead {
  border-bottom: 1px solid var(--rd-hairline);
  background: var(--rd-canvas);
}

.app-shell__masthead-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(28px, 5vw, 56px) clamp(16px, 4vw, 48px) clamp(24px, 4vw, 40px);
}

.app-shell__title {
  margin-top: 18px;
  font-size: clamp(28px, 3.6vw, 48px);
}

.app-shell__description {
  max-width: 620px;
  margin: 18px 0 0;
}

.app-shell__masthead-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}
</style>

<style>
/*
 * Unscoped: applies to whatever element a page passes as contentClass.
 * The bottom padding clears the fixed mobile nav plus the device inset, so no
 * page can hide its own last row behind the bar.
 */
.app-shell__content {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(20px, 3vw, 40px) clamp(16px, 4vw, 48px)
    calc(var(--rd-bottom-nav-height) + 32px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 900px) {
  .app-shell__content {
    padding-bottom: clamp(40px, 6vw, 72px);
  }
}

/* Full-bleed pages still need the mobile nav clearance. */
.app-shell-bleed {
  width: 100%;
  padding-bottom: calc(var(--rd-bottom-nav-height) + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 900px) {
  .app-shell-bleed {
    padding-bottom: 0;
  }
}
</style>
