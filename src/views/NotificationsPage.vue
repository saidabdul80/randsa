<template>
  <AppShell
    :show-header="false"
    :show-bottom-nav="false"
    content-class="mx-auto min-h-full w-full max-w-[1440px] px-4 pb-12 pt-5 sm:px-6 sm:pt-7 lg:px-8"
  >
    <div class="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-5">
      <NotificationSidebarNav :can-manage-properties="canManageProperties" />

      <main class="min-w-0">
        <header class="mb-6 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex min-w-0 items-start gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
            >
              <IonIcon :icon="notificationsOutline" class="text-2xl" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <h1 class="font-display text-3xl font-bold tracking-normal text-ink dark:text-white">
                Notifications
              </h1>
              <p class="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Stay close to booking confirmations, payment updates, inspection reminders, and
                browser alerts.
              </p>
            </div>
          </div>

          <div class="flex w-full items-center gap-2 xl:max-w-md">
            <label class="relative min-w-0 flex-1">
              <span class="sr-only">Search notifications</span>
              <IonIcon
                :icon="searchOutline"
                class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                aria-hidden="true"
              />
              <input
                v-model.trim="searchQuery"
                type="search"
                class="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100/70 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-500/10"
                placeholder="Search notifications..."
              />
            </label>
            <button
              type="button"
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              :disabled="isBusy || !state.profile"
              title="Refresh notifications"
              aria-label="Refresh notifications"
              @click="handleRefresh"
            >
              <IonIcon
                :icon="refreshOutline"
                class="text-xl"
                :class="isRefreshing ? 'animate-spin' : ''"
              />
            </button>
          </div>
        </header>

        <div
          v-if="message || pageError"
          role="status"
          class="mb-5 rounded-xl border px-4 py-3 text-sm"
          :class="
            messageTone === 'success' && !pageError
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'
          "
        >
          {{ pageError || message }}
        </div>

        <section class="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,0.9fr)]">
          <div
            class="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_16px_40px_-30px_rgba(16,32,51,0.45)] dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="flex items-center justify-between gap-4 px-4 pb-2 pt-5 sm:px-5">
              <div>
                <p class="text-xs font-bold text-brand-700 dark:text-brand-300">Inbox</p>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ notifications.length }} total / {{ unreadCount }} unread
                </p>
              </div>
              <IonIcon
                :icon="optionsOutline"
                class="text-xl text-slate-400"
                aria-label="Filter options below"
              />
            </div>

            <NotificationFilters v-model="activeFilter" :filters="availableFilters" />

            <div
              v-if="isInitialLoading"
              class="divide-y divide-slate-100 dark:divide-slate-800"
              aria-label="Loading notifications"
            >
              <div v-for="index in 4" :key="index" class="flex animate-pulse gap-4 px-5 py-5">
                <div class="h-12 w-12 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div class="flex-1">
                  <div class="h-4 w-2/5 rounded bg-slate-100 dark:bg-slate-800" />
                  <div class="mt-3 h-3 w-4/5 rounded bg-slate-100 dark:bg-slate-800" />
                  <div class="mt-3 h-6 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            </div>

            <div
              v-else-if="filteredNotifications.length"
              class="divide-y divide-slate-100 dark:divide-slate-800"
            >
              <NotificationItem
                v-for="notification in filteredNotifications"
                :key="notification.id"
                :notification="notification"
                :loading="isBusy"
                @mark-read="handleMarkRead"
              />
            </div>

            <div v-else class="grid min-h-72 place-items-center px-6 py-12 text-center">
              <div class="max-w-sm">
                <div
                  class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                >
                  <IonIcon :icon="notificationsOffOutline" class="text-2xl" aria-hidden="true" />
                </div>
                <h2 class="mt-4 text-lg font-bold text-ink dark:text-white">
                  {{ notifications.length ? 'No matching notifications' : 'No notifications yet' }}
                </h2>
                <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {{
                    notifications.length
                      ? 'Try another search or notification filter.'
                      : 'Booking confirmations, payment updates, and inspection reminders will appear here.'
                  }}
                </p>
                <button
                  v-if="notifications.length"
                  type="button"
                  class="mt-4 text-sm font-bold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
                  @click="clearFilters"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>

          <aside class="grid gap-4 xl:sticky xl:top-5">
            <section
              class="overflow-hidden rounded-[20px] bg-brand-600 p-6 text-white shadow-[0_18px_36px_-24px_rgba(31,111,231,0.75)]"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-xs font-bold text-brand-100">Inbox summary</p>
                  <div class="mt-3 flex items-end gap-2">
                    <span class="text-4xl font-extrabold leading-none">{{ unreadCount }}</span>
                    <span class="max-w-24 pb-0.5 text-sm font-semibold leading-5 text-brand-50">
                      unread notification{{ unreadCount === 1 ? '' : 's' }}
                    </span>
                  </div>
                </div>
                <div
                  class="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
                >
                  <IonIcon :icon="notificationsOutline" class="text-3xl" aria-hidden="true" />
                  <span
                    v-if="unreadCount"
                    class="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold ring-4 ring-brand-600"
                  >
                    {{ unreadCount }}
                  </span>
                </div>
              </div>
              <p class="mt-4 text-sm leading-6 text-brand-50">
                {{
                  unreadCount
                    ? 'You have notifications waiting for your attention.'
                    : 'You are all caught up.'
                }}
              </p>
              <button
                type="button"
                class="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
                @click="showInboxFocus"
              >
                {{ unreadCount ? 'View unread' : 'View all' }}
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </button>
            </section>

            <section
              class="rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_14px_32px_-28px_rgba(16,32,51,0.45)] dark:border-slate-800 dark:bg-slate-900"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-bold text-brand-700 dark:text-brand-300">Push readiness</p>
                <span
                  class="inline-flex items-center gap-1 text-xs font-semibold"
                  :class="
                    tokens.length
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-slate-500 dark:text-slate-400'
                  "
                >
                  <IonIcon
                    :icon="tokens.length ? checkmarkCircleOutline : alertCircleOutline"
                    aria-hidden="true"
                  />
                  {{ tokens.length ? 'Registered' : 'Not registered' }}
                </span>
              </div>
              <p class="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Browser alerts become available after this device is registered for push
                notifications.
              </p>

              <div v-if="tokens.length" class="mt-4 grid gap-3">
                <details
                  v-for="token in tokens"
                  :key="token.id"
                  class="group rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/50"
                >
                  <summary
                    class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-white"
                  >
                    <span class="min-w-0 truncate">{{ formatDeviceName(token.device) }}</span>
                    <IonIcon
                      :icon="chevronDownOutline"
                      class="shrink-0 transition group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div
                    class="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                  >
                    <p class="font-semibold text-slate-700 dark:text-slate-200">
                      Technical details
                    </p>
                    <p class="mt-2 break-words">{{ token.device }}</p>
                    <p class="mt-2 font-mono">Token: {{ maskToken(token.token) }}</p>
                    <p class="mt-2">Saved {{ formatDateTime(token.createdAt) }}</p>
                  </div>
                </details>
              </div>
              <p v-else class="mt-4 text-sm text-slate-500 dark:text-slate-400">
                This device has not been registered for browser alerts yet.
              </p>

              <button
                type="button"
                class="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-600 dark:hover:bg-brand-500"
                :disabled="!state.profile || isBusy"
                @click="handleEnableBrowserNotifications"
              >
                <IonIcon :icon="notificationsOutline" aria-hidden="true" />
                {{
                  activeAction === 'push'
                    ? 'Enabling...'
                    : tokens.length
                      ? 'Register this device'
                      : 'Enable push notifications'
                }}
              </button>
            </section>

            <section
              class="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]"
            >
              <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <IonIcon :icon="cloudDoneOutline" class="text-lg" aria-hidden="true" />
                <h2 class="text-xs font-bold">Delivery status</h2>
              </div>
              <p class="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Booking reminders run automatically on a schedule. You can also check for due
                reminders now.
              </p>
              <button
                type="button"
                class="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-300"
                :disabled="!state.profile || isBusy"
                @click="handleRunReminderScan"
              >
                {{ activeAction === 'reminders' ? 'Checking reminders...' : 'Check due reminders' }}
                <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
              </button>
            </section>

            <section
              class="rounded-[20px] border border-violet-100 bg-violet-50/65 p-5 dark:border-violet-500/20 dark:bg-violet-500/[0.08]"
            >
              <div class="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <IonIcon :icon="calendarClearOutline" class="text-lg" aria-hidden="true" />
                <h2 class="text-xs font-bold">Reminder logic</h2>
              </div>
              <div class="mt-3 grid gap-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                <p>Reminders are generated when a booking begins within the next 24 hours.</p>
                <p>Booking confirmations are created when a reservation is scheduled.</p>
                <p>Payment confirmations are created after a payment is verified.</p>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  arrowForwardOutline,
  calendarClearOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  cloudDoneOutline,
  notificationsOffOutline,
  notificationsOutline,
  optionsOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'

import NotificationFilters, {
  type NotificationFilterOption,
} from '../components/notifications/NotificationFilters.vue'
import NotificationItem from '../components/notifications/NotificationItem.vue'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import AppShell from '../components/layout/AppShell.vue'
import { useAuth } from '../composables/useAuth'
import { useNotifications } from '../composables/useNotifications'
import type { NotificationRecord, NotificationType } from '../types/notification'

type NotificationFilter = 'all' | 'unread' | NotificationType | 'browser'

const { state, canManageProperties } = useAuth()
const {
  notifications,
  tokens,
  isLoading,
  refreshForUser,
  enableBrowserNotifications,
  markRead,
  runReminderScan,
} = useNotifications()

const activeFilter = ref<NotificationFilter>('all')
const searchQuery = ref('')
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const loadError = ref('')
const isInitialLoading = ref(true)
const isRefreshing = ref(false)
const activeAction = ref<'push' | 'reminders' | 'mark-read' | null>(null)

const unreadCount = computed(
  () => notifications.value.filter((notification) => !notification.readAt).length
)
const pageError = computed(
  () => loadError.value || (messageTone.value === 'error' ? message.value : '')
)
const isBusy = computed(() => isLoading.value || isRefreshing.value)

const filterLabels: Record<NotificationType, string> = {
  inspection_reminder: 'Reminders',
  booking_confirmation: 'Bookings',
  payment_confirmation: 'Payments',
  rent_due_reminder: 'Rent',
  admin_message: 'System',
}

const availableFilters = computed<NotificationFilterOption[]>(() => {
  const filters: NotificationFilterOption[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread', count: unreadCount.value },
  ]

  for (const type of Object.keys(filterLabels) as NotificationType[]) {
    if (notifications.value.some((notification) => notification.type === type)) {
      filters.push({ value: type, label: filterLabels[type] })
    }
  }

  if (notifications.value.some((notification) => notification.channel === 'browser')) {
    filters.push({ value: 'browser', label: 'Browser' })
  }

  return filters
})

const filteredNotifications = computed(() => {
  const query = searchQuery.value.toLocaleLowerCase()

  return notifications.value.filter((notification) => {
    const matchesFilter = matchesActiveFilter(notification)
    const matchesSearch =
      !query ||
      notification.title.toLocaleLowerCase().includes(query) ||
      notification.body.toLocaleLowerCase().includes(query)

    return matchesFilter && matchesSearch
  })
})

watch(
  () => state.profile?.uid,
  async (userId) => {
    message.value = ''
    loadError.value = ''
    isInitialLoading.value = true

    try {
      await refreshForUser(userId)
    } catch (caughtError) {
      loadError.value = toErrorMessage(caughtError, 'Could not load notifications.')
    } finally {
      isInitialLoading.value = false
    }
  },
  { immediate: true }
)

watch(availableFilters, (filters) => {
  if (!filters.some((filter) => filter.value === activeFilter.value)) {
    activeFilter.value = 'all'
  }
})

function matchesActiveFilter(notification: NotificationRecord) {
  if (activeFilter.value === 'all') return true
  if (activeFilter.value === 'unread') return !notification.readAt
  if (activeFilter.value === 'browser') return notification.channel === 'browser'
  return notification.type === activeFilter.value
}

async function handleRefresh() {
  if (!state.profile) return

  message.value = ''
  loadError.value = ''
  isRefreshing.value = true

  try {
    await refreshForUser(state.profile.uid)
  } catch (caughtError) {
    loadError.value = toErrorMessage(caughtError, 'Could not refresh notifications.')
  } finally {
    isRefreshing.value = false
  }
}

async function handleEnableBrowserNotifications() {
  if (!state.profile) {
    showError('Sign in before enabling notifications.')
    return
  }

  try {
    activeAction.value = 'push'
    await enableBrowserNotifications(state.profile.uid)
    showSuccess('Push notifications enabled and this device was registered.')
  } catch (caughtError) {
    showError(toErrorMessage(caughtError, 'Could not enable browser notifications.'))
  } finally {
    activeAction.value = null
  }
}

async function handleRunReminderScan() {
  if (!state.profile) {
    showError('Sign in before running reminder scans.')
    return
  }

  try {
    activeAction.value = 'reminders'
    const created = await runReminderScan(state.profile.uid)
    showSuccess(
      created.length
        ? `${created.length} reminder notification${created.length === 1 ? '' : 's'} generated.`
        : 'No due inspection reminders were found right now.'
    )
  } catch (caughtError) {
    showError(toErrorMessage(caughtError, 'Could not run reminder scan.'))
  } finally {
    activeAction.value = null
  }
}

async function handleMarkRead(notificationId: string) {
  if (!state.profile) {
    showError('Sign in before marking notifications as read.')
    return
  }

  try {
    activeAction.value = 'mark-read'
    await markRead(notificationId, state.profile.uid)
    showSuccess('Notification marked as read.')
  } catch (caughtError) {
    showError(toErrorMessage(caughtError, 'Could not mark the notification as read.'))
  } finally {
    activeAction.value = null
  }
}

function showInboxFocus() {
  activeFilter.value = unreadCount.value ? 'unread' : 'all'
  searchQuery.value = ''
}

function clearFilters() {
  activeFilter.value = 'all'
  searchQuery.value = ''
}

function maskToken(token: string) {
  if (token.length <= 16) return `${token.slice(0, 4)}...`
  return `${token.slice(0, 10)}...${token.slice(-6)}`
}

function formatDeviceName(device: string) {
  if (/Edg\//i.test(device)) return 'Microsoft Edge browser'
  if (/Chrome\//i.test(device)) return 'Google Chrome browser'
  if (/Firefox\//i.test(device)) return 'Mozilla Firefox browser'
  if (/Safari\//i.test(device)) return 'Safari browser'
  return 'Registered browser'
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function showSuccess(value: string) {
  loadError.value = ''
  messageTone.value = 'success'
  message.value = value
}

function showError(value: string) {
  loadError.value = ''
  messageTone.value = 'error'
  message.value = value
}

function toErrorMessage(caughtError: unknown, fallback: string) {
  return caughtError instanceof Error ? caughtError.message : fallback
}
</script>
