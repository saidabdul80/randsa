<template>
  <header
    ref="headerRef"
    class="app-header"
    :class="{
      'app-header--overlay': floating,
      'app-header--transparent': floating && !isScrolled,
      'app-header--solid': isScrolled,
    }"
  >
    <div class="app-header__inner">
      <RouterLink to="/home" class="app-header__wordmark" aria-label="RANDSA home">
        <span class="app-header__monogram" aria-hidden="true">R</span>
        <span class="app-header__wordmark-text">RANDSA</span>
      </RouterLink>

      <nav class="app-header__nav" aria-label="Primary">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="app-header__link"
          :class="{ 'app-header__link--active': isNavItemActive(item, route.path) }"
          :aria-current="isNavItemActive(item, route.path) ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="app-header__actions">
        <RouterLink
          v-if="isAuthenticated"
          to="/notifications"
          class="rd-icon-button app-header__badge-host"
          aria-label="Notifications"
        >
          <IonIcon :icon="notificationsOutline" aria-hidden="true" />
          <span v-if="unreadCount > 0" class="app-header__badge" aria-hidden="true">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
          <span v-if="unreadCount > 0" class="rd-sr-only">{{ unreadCount }} unread</span>
        </RouterLink>

        <ThemeToggleButton />

        <RouterLink v-if="!isAuthenticated" to="/login" class="app-header__signin">
          Sign in
        </RouterLink>
        <RouterLink v-else to="/profile" class="app-header__avatar" :aria-label="accountLabel">
          {{ profileInitial }}
        </RouterLink>

        <RouterLink to="/post-listing" class="rd-cta rd-cta--sm app-header__post">
          Post a listing
        </RouterLink>

        <button
          type="button"
          class="rd-icon-button app-header__menu"
          :aria-expanded="isDrawerOpen"
          aria-controls="app-drawer"
          aria-label="Open menu"
          @click="isDrawerOpen = true"
        >
          <IonIcon :icon="menuOutline" aria-hidden="true" />
        </button>
      </div>
    </div>

    <AppDrawer :open="isDrawerOpen" @close="isDrawerOpen = false" />
  </header>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { menuOutline, notificationsOutline } from 'ionicons/icons'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { headerNavItems, isNavItemActive, visibleNavItems } from '../../config/navigation'
import { useAuth } from '../../composables/useAuth'
import AppDrawer from './AppDrawer.vue'
import ThemeToggleButton from './ThemeToggleButton.vue'

const props = withDefaults(
  defineProps<{
    /** Transparent over a hero image until the page is scrolled. */
    floating?: boolean
    unreadCount?: number
  }>(),
  { floating: false, unreadCount: 0 }
)

const route = useRoute()
const { isAuthenticated, role, state } = useAuth()
const headerRef = ref<HTMLElement | null>(null)
const isDrawerOpen = ref(false)
const isScrolled = ref(false)

const navItems = computed(() =>
  visibleNavItems(headerNavItems, { isAdmin: role.value === 'admin' })
)
const profileInitial = computed(() =>
  (state.profile?.fullName || state.profile?.email || 'R').trim().charAt(0).toUpperCase()
)
const accountLabel = computed(() => `Account centre — ${state.profile?.fullName ?? 'your account'}`)

// Close the drawer on navigation so the menu never lingers over a new page.
watch(
  () => route.fullPath,
  () => (isDrawerOpen.value = false)
)

/*
 * Ionic scrolls inside ion-content's own scroller, not the window, so a window scroll
 * listener never fires and the header would stay transparent forever. Bind to the
 * ion-content scroll element, falling back to the window outside an Ionic page.
 */
let scrollTarget: HTMLElement | Window | null = null

function currentScrollTop() {
  if (scrollTarget && scrollTarget !== window) return (scrollTarget as HTMLElement).scrollTop
  return window.scrollY
}

function updateScrollState() {
  // Switch to the solid surface just before the hero copy would collide with the bar.
  isScrolled.value = currentScrollTop() > 24
}

onMounted(async () => {
  if (!props.floating) return

  const ionContent = headerRef.value?.closest('ion-content') as
    (HTMLElement & { getScrollElement?: () => Promise<HTMLElement> }) | null

  scrollTarget = ionContent?.getScrollElement ? await ionContent.getScrollElement() : window
  scrollTarget.addEventListener('scroll', updateScrollState, { passive: true })
  updateScrollState()
})

onBeforeUnmount(() => scrollTarget?.removeEventListener('scroll', updateScrollState))
</script>

<style scoped>
.app-header {
  position: sticky;
  z-index: 60;
  top: 0;
  border-bottom: 1px solid var(--rd-hairline);
  background: var(--rd-surface);
  padding-top: env(safe-area-inset-top, 0px);
  transition:
    background-color 260ms ease,
    border-color 260ms ease,
    box-shadow 260ms ease;
}

/*
 * Position stays fixed for the whole scroll on a hero page. Only the paint changes,
 * so the bar never re-flows or jumps when it turns solid.
 */
.app-header--overlay {
  position: fixed;
  inset-inline: 0;
}

.app-header--transparent {
  border-bottom-color: transparent;
  background: linear-gradient(to bottom, rgba(7, 10, 15, 0.55), transparent);
}

/* Scrolled into the listings: solid white surface with a hairline and lift. */
.app-header--solid {
  border-bottom-color: var(--rd-hairline);
  background: var(--rd-surface);
  box-shadow: var(--rd-shadow-sm);
}

.app-header__inner {
  display: flex;
  height: var(--rd-header-height);
  max-width: 1280px;
  align-items: center;
  gap: 20px;
  margin: 0 auto;
  padding-inline: clamp(16px, 4vw, 48px);
}

/* ---------- wordmark ---------- */

.app-header__wordmark {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--rd-ink);
  text-decoration: none;
}

.app-header__monogram {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--rd-brass);
  border-radius: 3px;
  color: var(--rd-brass);
  font-family: var(--rd-font-display);
  font-size: 17px;
  line-height: 1;
}

.app-header__wordmark-text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.34em;
}

/* ---------- nav ---------- */

.app-header__nav {
  display: none;
  flex: 1;
  align-items: center;
  gap: 28px;
}

.app-header__link {
  position: relative;
  padding: 6px 0;
  color: var(--rd-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-decoration: none;
  text-transform: uppercase;
  transition: color 200ms ease;
}

.app-header__link::after {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--rd-brass);
  content: '';
  transition: width 260ms var(--rd-ease, cubic-bezier(0.33, 0, 0.2, 1));
}

.app-header__link:hover,
.app-header__link--active {
  color: var(--rd-ink);
}

.app-header__link:hover::after,
.app-header__link--active::after {
  width: 100%;
}

/* ---------- actions ---------- */

.app-header__actions {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.app-header__badge-host {
  position: relative;
}

.app-header__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 17px;
  border-radius: 999px;
  background: var(--rd-brass);
  padding: 0 4px;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  line-height: 17px;
  text-align: center;
}

.app-header__signin {
  padding: 0 6px;
  color: var(--rd-ink);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.app-header__signin:hover {
  color: var(--rd-brass);
}

.app-header__avatar {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--rd-border);
  border-radius: 999px;
  background: var(--rd-brass-soft);
  color: var(--rd-brass);
  font-family: var(--rd-font-display);
  font-size: 16px;
  text-decoration: none;
}

.app-header__avatar:hover {
  border-color: var(--rd-brass);
}

.app-header__post {
  display: none;
}

/* ---------- responsive ---------- */

@media (min-width: 900px) {
  .app-header__nav {
    display: flex;
  }

  .app-header__post {
    display: inline-flex;
  }

  .app-header__menu {
    display: none;
  }
}

/*
 * Over the hero photo the ink flips to plate colours against the scrim; once the bar
 * turns solid it reverts to the normal token colours, which the base rules already set.
 */
.app-header--transparent .app-header__wordmark,
.app-header--transparent .app-header__link,
.app-header--transparent .app-header__signin {
  color: var(--rd-plate-ink);
}

.app-header--transparent .app-header__monogram {
  border-color: var(--rd-plate-accent);
  color: var(--rd-plate-accent);
}

.app-header--transparent :deep(.rd-icon-button) {
  border-color: rgba(248, 245, 240, 0.32);
  color: var(--rd-plate-ink);
}

.app-header--transparent .app-header__avatar {
  border-color: rgba(248, 245, 240, 0.32);
  background: rgba(11, 14, 19, 0.4);
  color: var(--rd-plate-accent);
}

@media (prefers-reduced-motion: reduce) {
  .app-header,
  .app-header__link,
  .app-header__link::after {
    transition: none;
  }
}
</style>
