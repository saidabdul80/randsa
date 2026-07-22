<template>
  <aside class="hidden lg:block">
    <div class="sticky top-5 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_16px_40px_-30px_rgba(16,32,51,0.45)] dark:border-slate-800 dark:bg-slate-900">
      <RouterLink
        to="/home"
        class="flex items-center gap-3 border-b border-slate-100 px-3 pb-4 pt-2 dark:border-slate-800"
      >
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
          <IonIcon :icon="homeOutline" class="text-xl" aria-hidden="true" />
        </span>
        <span>
          <span class="block text-base font-extrabold text-ink dark:text-white">RANDSA</span>
          <span class="block text-[11px] font-semibold text-slate-400">Navigation</span>
        </span>
      </RouterLink>

      <nav class="mt-3 grid gap-1" :aria-label="ariaLabel">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.to"
          :to="item.to"
          class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          :class="isActive(item.matchers)
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200'
            : item.to === '/add-property'
              ? 'text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10'
              : 'text-slate-600 hover:bg-slate-50 hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'"
        >
          <IonIcon :icon="item.icon" class="text-xl" aria-hidden="true" />
          <span>{{ item.label }}</span>
          <span
            v-if="isActive(item.matchers)"
            class="ml-auto h-2 w-2 rounded-full bg-brand-600"
            aria-hidden="true"
          />
        </RouterLink>
      </nav>
    </div>
  </aside>

  <nav
    v-if="showMobile"
    class="mb-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_30px_-26px_rgba(16,32,51,0.45)] lg:hidden dark:border-slate-800 dark:bg-slate-900"
    :aria-label="ariaLabel"
  >
    <div class="flex min-w-max items-center gap-1">
      <RouterLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        :class="isActive(item.matchers)
          ? 'bg-brand-600 text-white'
          : item.to === '/add-property'
            ? 'text-brand-700 dark:text-brand-300'
            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'"
      >
        <IonIcon :icon="item.icon" class="text-lg" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  addCircleOutline,
  calendarOutline,
  homeOutline,
  notificationsOutline,
  personOutline,
  searchOutline,
} from 'ionicons/icons'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const props = withDefaults(
  defineProps<{
    canManageProperties: boolean
    ariaLabel?: string
    showMobile?: boolean
  }>(),
  {
    ariaLabel: 'Notifications page navigation',
    showMobile: true,
  },
)

const route = useRoute()

const navItems = [
  { label: 'Home', to: '/home', icon: homeOutline, matchers: ['/home'], requiresManager: false },
  {
    label: 'Explore',
    to: '/properties',
    icon: searchOutline,
    matchers: ['/properties', '/saved-properties'],
    requiresManager: false,
  },
  {
    label: 'Add property',
    to: '/add-property',
    icon: addCircleOutline,
    matchers: ['/add-property', '/edit-property'],
    requiresManager: true,
  },
  {
    label: 'Bookings',
    to: '/my-bookings',
    icon: calendarOutline,
    matchers: ['/my-bookings', '/booking', '/payment'],
    requiresManager: false,
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: notificationsOutline,
    matchers: ['/notifications'],
    requiresManager: false,
  },
  {
    label: 'Account Center',
    to: '/profile',
    icon: personOutline,
    matchers: ['/profile'],
    requiresManager: false,
  },
] as const

const visibleItems = computed(() =>
  navItems.filter((item) => !item.requiresManager || props.canManageProperties),
)

function isActive(matchers: readonly string[]) {
  return matchers.some((matcher) => route.path === matcher || route.path.startsWith(`${matcher}/`))
}
</script>
