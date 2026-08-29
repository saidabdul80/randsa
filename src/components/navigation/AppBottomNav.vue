<template>
  <nav class="bottom-nav" aria-label="Primary">
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{
        'bottom-nav__item--active': isNavItemActive(item, route.path),
        'bottom-nav__item--accent': item.to === '/post-listing',
      }"
      :aria-current="isNavItemActive(item, route.path) ? 'page' : undefined"
    >
      <span class="bottom-nav__icon">
        <IonIcon :icon="item.icon" aria-hidden="true" />
      </span>
      <span class="bottom-nav__label">{{ item.shortLabel ?? item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { isNavItemActive, primaryNavItems, visibleNavItems } from '../../config/navigation'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const { role } = useAuth()

const navItems = computed(() =>
  visibleNavItems(primaryNavItems, { isAdmin: role.value === 'admin' })
)
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  z-index: 70;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: stretch;
  border-top: 1px solid var(--rd-hairline);
  background: var(--rd-surface);
  /* The inset only resolves because index.html sets viewport-fit=cover. */
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-shadow: 0 -8px 24px -20px rgba(11, 14, 19, 0.5);
}

.bottom-nav__item {
  position: relative;
  display: flex;
  /* 44px minimum tap target on the shortest supported viewport. */
  min-height: var(--rd-bottom-nav-height);
  min-width: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 4px;
  color: var(--rd-subtle);
  text-decoration: none;
  transition: color 200ms ease;
}

/* Brass hairline marks the active tab rather than a heavy filled pill. */
.bottom-nav__item::before {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--rd-brass);
  content: '';
  transform: translateX(-50%);
  transition: width 240ms cubic-bezier(0.33, 0, 0.2, 1);
}

.bottom-nav__item--active {
  color: var(--rd-ink);
}

.bottom-nav__item--active::before {
  width: 34px;
}

.bottom-nav__icon {
  display: grid;
  place-items: center;
  font-size: 21px;
  line-height: 1;
}

.bottom-nav__item--active .bottom-nav__icon {
  color: var(--rd-brass);
}

.bottom-nav__label {
  max-width: 100%;
  overflow: hidden;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Post a listing reads as the primary action without breaking the row rhythm. */
.bottom-nav__item--accent .bottom-nav__icon {
  width: 38px;
  height: 38px;
  border: 1px solid var(--rd-brass);
  border-radius: 999px;
  color: var(--rd-brass);
  font-size: 20px;
}

.bottom-nav__item--accent.bottom-nav__item--active .bottom-nav__icon {
  background: var(--rd-brass);
  color: #fff;
}

.bottom-nav__item:hover {
  color: var(--rd-ink);
}

/* The bar is a mobile affordance; desktop navigates from the header. */
@media (min-width: 900px) {
  .bottom-nav {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-nav__item,
  .bottom-nav__item::before {
    transition: none;
  }
}
</style>
