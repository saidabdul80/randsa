<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="drawer-root">
        <div class="drawer-scrim" @click="$emit('close')" />

        <aside
          id="app-drawer"
          ref="panelRef"
          class="drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          @keydown.esc="$emit('close')"
          @keydown.tab="trapFocus"
        >
          <header class="drawer-head">
            <RouterLink to="/home" class="drawer-wordmark" @click="$emit('close')">
              <span class="drawer-monogram" aria-hidden="true">R</span>
              <span>RANDSA</span>
            </RouterLink>
            <button
              ref="closeRef"
              type="button"
              class="rd-icon-button"
              aria-label="Close menu"
              @click="$emit('close')"
            >
              <IonIcon :icon="closeOutline" aria-hidden="true" />
            </button>
          </header>

          <RouterLink
            v-if="isAuthenticated"
            to="/profile"
            class="drawer-account"
            @click="$emit('close')"
          >
            <span class="drawer-account__avatar" aria-hidden="true">{{ profileInitial }}</span>
            <span class="drawer-account__copy">
              <span class="drawer-account__name">{{ displayName }}</span>
              <span class="drawer-account__role">{{ roleLabel }}</span>
            </span>
            <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
          </RouterLink>

          <div v-else class="drawer-guest">
            <p class="rd-body">Sign in to save listings, book, and manage your posts.</p>
            <div class="drawer-guest__actions">
              <RouterLink to="/login" class="rd-cta rd-cta--sm" @click="$emit('close')">
                Sign in
              </RouterLink>
              <RouterLink
                to="/register"
                class="rd-cta rd-cta--sm rd-cta--ghost"
                @click="$emit('close')"
              >
                Create account
              </RouterLink>
            </div>
          </div>

          <nav class="drawer-nav" aria-label="All destinations">
            <p class="rd-meta drawer-nav__label">Browse</p>
            <RouterLink
              v-for="item in primaryItems"
              :key="item.to"
              :to="item.to"
              class="drawer-link"
              :class="{ 'drawer-link--active': isNavItemActive(item, route.path) }"
              :aria-current="isNavItemActive(item, route.path) ? 'page' : undefined"
              @click="$emit('close')"
            >
              <IonIcon :icon="item.icon" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </RouterLink>

            <hr class="rd-hairline drawer-divider" />

            <p class="rd-meta drawer-nav__label">Manage</p>
            <RouterLink
              v-for="item in secondaryItems"
              :key="item.to"
              :to="item.to"
              class="drawer-link"
              :class="{ 'drawer-link--active': isNavItemActive(item, route.path) }"
              :aria-current="isNavItemActive(item, route.path) ? 'page' : undefined"
              @click="$emit('close')"
            >
              <IonIcon :icon="item.icon" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </nav>

          <footer class="drawer-foot">
            <span class="rd-meta">Theme</span>
            <ThemeToggleButton />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { chevronForwardOutline, closeOutline } from 'ionicons/icons'
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import {
  isNavItemActive,
  primaryNavItems,
  secondaryNavItems,
  visibleNavItems,
} from '../../config/navigation'
import { useAuth } from '../../composables/useAuth'
import ThemeToggleButton from './ThemeToggleButton.vue'

const props = defineProps<{ open: boolean }>()
defineEmits<{ close: [] }>()

const route = useRoute()
const { isAuthenticated, role, state } = useAuth()
const panelRef = ref<HTMLElement | null>(null)
const closeRef = ref<HTMLButtonElement | null>(null)

const isAdmin = computed(() => role.value === 'admin')
const primaryItems = computed(() => visibleNavItems(primaryNavItems, { isAdmin: isAdmin.value }))
const secondaryItems = computed(() =>
  visibleNavItems(secondaryNavItems, { isAdmin: isAdmin.value })
)
const displayName = computed(
  () => state.profile?.fullName || state.profile?.email || 'Your account'
)
const profileInitial = computed(() => displayName.value.trim().charAt(0).toUpperCase())
const roleLabel = computed(() => {
  const value = state.profile?.role
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)} account` : 'Signed in'
})

// Lock the page behind the drawer and move focus into it, per dialog semantics.
watch(
  () => props.open,
  async (isOpen) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = isOpen ? 'hidden' : ''

    if (isOpen) {
      await nextTick()
      closeRef.value?.focus()
    }
  }
)

function trapFocus(event: KeyboardEvent) {
  const focusable = panelRef.value?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
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
.drawer-root {
  position: fixed;
  z-index: 120;
  inset: 0;
}

.drawer-scrim {
  position: absolute;
  inset: 0;
  backdrop-filter: blur(2px);
  background: var(--rd-overlay);
}

.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  width: min(360px, 88vw);
  height: 100%;
  flex-direction: column;
  border-left: 1px solid var(--rd-hairline);
  background: var(--rd-canvas);
  box-shadow: var(--rd-shadow-lg);
  overflow-y: auto;
  padding: env(safe-area-inset-top, 0px) 20px calc(20px + env(safe-area-inset-bottom, 0px));
}

.drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
}

.drawer-wordmark {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  color: var(--rd-ink);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.34em;
  text-decoration: none;
}

.drawer-monogram {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--rd-brass);
  border-radius: 3px;
  color: var(--rd-brass);
  font-family: var(--rd-font-display);
  font-size: 17px;
  letter-spacing: 0;
  line-height: 1;
}

/* ---------- account ---------- */

.drawer-account {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid var(--rd-hairline);
  border-radius: var(--rd-radius);
  background: var(--rd-surface);
  padding: 14px 16px;
  color: var(--rd-ink);
  text-decoration: none;
  transition: border-color 200ms ease;
}

.drawer-account:hover {
  border-color: var(--rd-brass);
}

.drawer-account__avatar {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: var(--rd-brass-soft);
  color: var(--rd-brass);
  font-family: var(--rd-font-display);
  font-size: 18px;
}

.drawer-account__copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.drawer-account__name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-account__role {
  color: var(--rd-subtle);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.drawer-guest {
  border: 1px solid var(--rd-hairline);
  border-radius: var(--rd-radius);
  background: var(--rd-surface);
  padding: 18px;
}

.drawer-guest__actions {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}

/* ---------- nav ---------- */

.drawer-nav {
  flex: 1;
  padding: 24px 0 8px;
}

.drawer-nav__label {
  margin: 0 0 10px;
}

.drawer-divider {
  margin: 20px 0;
}

.drawer-link {
  display: flex;
  min-height: 48px;
  align-items: center;
  gap: 14px;
  border-radius: var(--rd-radius-sm);
  padding: 0 12px;
  margin-inline: -12px;
  color: var(--rd-muted);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.drawer-link ion-icon {
  font-size: 20px;
}

.drawer-link:hover {
  background: var(--rd-surface-sunken);
  color: var(--rd-ink);
}

.drawer-link--active {
  background: var(--rd-brass-soft);
  color: var(--rd-brass);
}

.drawer-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--rd-hairline);
  padding-top: 18px;
}

/* ---------- motion ---------- */

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 280ms cubic-bezier(0.33, 0, 0.2, 1);
}

.drawer-enter-active .drawer-scrim,
.drawer-leave-active .drawer-scrim {
  transition: opacity 280ms ease;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

.drawer-enter-from .drawer-scrim,
.drawer-leave-to .drawer-scrim {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active .drawer-panel,
  .drawer-leave-active .drawer-panel,
  .drawer-enter-active .drawer-scrim,
  .drawer-leave-active .drawer-scrim {
    transition: none;
  }
}
</style>
