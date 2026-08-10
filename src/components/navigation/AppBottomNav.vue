<template>
  <nav
    aria-label="Primary navigation"
    class="pointer-events-none fixed inset-x-0 bottom-3 z-50 px-3 pb-[env(safe-area-inset-bottom)] sm:bottom-4 sm:px-4"
  >
    <div
      class="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-[24px] border border-white/[0.70] bg-white/[0.88] px-2 py-2 shadow-panel backdrop-blur-2xl dark:border-white/[0.10] dark:bg-slate-900/[0.88]"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :aria-label="item.label"
        class="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[18px] px-1.5 py-2 text-[10px] font-semibold transition sm:min-w-[64px] sm:px-2 sm:text-[11px]"
        :class="
          isActive(item.matchers)
            ? item.to === '/post-listing'
              ? 'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-500/30'
              : 'bg-ink text-white shadow-lg shadow-slate-900/20'
            : item.to === '/post-listing'
              ? 'text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/10'
              : 'text-slate-500 hover:bg-slate-100 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800'
        "
      >
        <ion-icon :icon="item.icon" class="text-[1.15rem]" />
        <span class="min-h-6 max-w-full text-center leading-3">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  addCircleOutline,
  albumsOutline,
  calendarOutline,
  homeOutline,
  personOutline,
} from 'ionicons/icons'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { label: 'Home', to: '/home', icon: homeOutline, matchers: ['/home'] },
  {
    label: 'My Listings',
    to: '/my-listings',
    icon: albumsOutline,
    matchers: ['/my-listings'],
  },
  {
    label: 'Post Listing',
    to: '/post-listing',
    icon: addCircleOutline,
    matchers: ['/post-listing', '/add-property', '/edit-property', '/edit-listing'],
  },
  {
    label: 'Bookings',
    to: '/my-bookings',
    icon: calendarOutline,
    matchers: ['/my-bookings', '/booking', '/payment'],
  },
  {
    label: 'Account Center',
    to: '/profile',
    icon: personOutline,
    matchers: ['/profile', '/notifications'],
  },
] as const

function isActive(matchers: readonly string[]) {
  return matchers.some((matcher) => route.path === matcher || route.path.startsWith(`${matcher}/`))
}
</script>
