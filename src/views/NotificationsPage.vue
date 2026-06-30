<template>
  <AppShell
    eyebrow="Updates"
    title="Notifications"
    description="Stay close to booking confirmations, payment updates, inspection reminders, and browser alerts."
  >
    <section class="grid gap-5 lg:grid-cols-[1fr_0.92fr]">
      <div class="grid gap-5">
        <div class="glass-panel p-6 sm:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Inbox</p>
              <h2 class="mt-2 text-2xl font-bold text-ink dark:text-white">
                {{ notifications.length }} notification{{ notifications.length === 1 ? '' : 's' }}
              </h2>
              <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
                Booking confirmations, payment updates, and inspection reminders collect here for the signed-in account.
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">Unread</p>
              <p class="mt-2 text-3xl font-bold text-ink dark:text-white">{{ unreadCount }}</p>
            </div>
          </div>

          <div
            v-if="message || error"
            class="mt-5 rounded-[22px] border px-4 py-4 text-sm"
            :class="messageTone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200'"
          >
            {{ message || error }}
          </div>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              class="premium-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!state.profile || isLoading"
              @click="handleEnableBrowserNotifications"
            >
              {{ isLoading ? 'Working...' : 'Enable push notifications' }}
            </button>
            <button
              type="button"
              class="premium-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!state.profile || isLoading"
              @click="handleRunReminderScan"
            >
              Check due reminders
            </button>
          </div>
        </div>

        <section v-if="notifications.length" class="grid gap-4">
          <article
            v-for="notification in notifications"
            :key="notification.id"
            class="glass-panel p-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex flex-wrap items-center gap-3">
                  <h2 class="text-lg font-bold text-ink dark:text-white">{{ notification.title }}</h2>
                  <span
                    class="status-pill"
                    :class="notification.readAt
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200'"
                  >
                    {{ notification.readAt ? 'Read' : 'Unread' }}
                  </span>
                </div>
                <p class="mt-2 text-sm leading-7 text-mist dark:text-slate-300">{{ notification.body }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {{ formatNotificationTypeLabel(notification.type) }}
                  </span>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {{ notification.channel }}
                  </span>
                </div>
              </div>
              <div class="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                <p>{{ formatDateTime(notification.createdAt) }}</p>
                <button
                  v-if="!notification.readAt"
                  type="button"
                  class="mt-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  :disabled="isLoading"
                  @click="handleMarkRead(notification.id)"
                >
                  Mark read
                </button>
              </div>
            </div>
          </article>
        </section>

        <section v-else class="glass-panel grid place-items-center p-10 text-center sm:p-14">
          <div class="max-w-md">
            <div class="empty-state-mark">0</div>
            <h2 class="mt-6 text-2xl font-bold text-ink dark:text-white">No notifications yet</h2>
            <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
              Booking confirmations, payment confirmations, and inspection reminders will appear here when activity starts.
            </p>
          </div>
        </section>
      </div>

      <div class="grid gap-4">
        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Token readiness</p>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Browser alerts become available after this device is registered for push notifications.
          </p>
          <div v-if="tokens.length" class="mt-4 grid gap-3">
            <article
              v-for="token in tokens"
              :key="token.id"
              class="rounded-[22px] border border-slate-200 bg-white/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <p class="text-sm font-semibold text-ink dark:text-white">{{ token.device }}</p>
              <p class="mt-2 break-all text-xs text-slate-500 dark:text-slate-400">{{ token.token }}</p>
              <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Saved {{ formatDateTime(token.createdAt) }}</p>
            </article>
          </div>
          <p v-else class="mt-4 text-sm text-mist dark:text-slate-300">
            This device has not been registered for browser alerts yet.
          </p>
        </div>

        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Reminder logic</p>
          <div class="mt-4 grid gap-3 text-sm text-mist dark:text-slate-300">
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 dark:bg-slate-950/60">Inspection reminders are generated when a booking is within the next 24 hours.</div>
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 dark:bg-slate-950/60">Booking confirmations are created when an inspection is scheduled.</div>
            <div class="rounded-[22px] bg-slate-50 px-4 py-4 dark:bg-slate-950/60">Payment confirmations are created when a payment changes status.</div>
          </div>
        </div>

        <div class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Delivery status</p>
          <p class="mt-3 text-sm leading-7 text-mist dark:text-slate-300">
            Inspection reminders run automatically on a schedule, and this page also lets you check due reminders manually.
          </p>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppShell from '../components/layout/AppShell.vue'
import { useAuth } from '../composables/useAuth'
import { useNotifications } from '../composables/useNotifications'
import { formatNotificationTypeLabel } from '../types/notification'

const { state } = useAuth()
const {
  notifications,
  tokens,
  isLoading,
  error,
  refreshForUser,
  enableBrowserNotifications,
  markRead,
  runReminderScan,
} = useNotifications()

const message = ref('')
const messageTone = ref<'success' | 'error'>('success')

const unreadCount = computed(() => notifications.value.filter((notification) => !notification.readAt).length)

watch(
  () => state.profile?.uid,
  (userId) => {
    message.value = ''
    void refreshForUser(userId)
  },
  { immediate: true },
)

async function handleEnableBrowserNotifications() {
  if (!state.profile) {
    messageTone.value = 'error'
    message.value = 'Sign in before enabling notifications.'
    return
  }

  try {
    await enableBrowserNotifications(state.profile.uid)
    messageTone.value = 'success'
    message.value = 'Push notifications enabled and the Firebase device token was saved.'
  } catch (caughtError) {
    messageTone.value = 'error'
    message.value =
      caughtError instanceof Error ? caughtError.message : 'Could not enable browser notifications.'
  }
}

async function handleRunReminderScan() {
  if (!state.profile) {
    messageTone.value = 'error'
    message.value = 'Sign in before running reminder scans.'
    return
  }

  try {
    const created = await runReminderScan(state.profile.uid)
    messageTone.value = 'success'
    message.value = created.length
      ? `${created.length} reminder notification${created.length === 1 ? '' : 's'} generated.`
      : 'No due inspection reminders were found right now.'
  } catch (caughtError) {
    messageTone.value = 'error'
    message.value = caughtError instanceof Error ? caughtError.message : 'Could not run reminder scan.'
  }
}

async function handleMarkRead(notificationId: string) {
  if (!state.profile) {
    messageTone.value = 'error'
    message.value = 'Sign in before marking notifications as read.'
    return
  }

  try {
    await markRead(notificationId, state.profile.uid)
    messageTone.value = 'success'
    message.value = 'Notification marked as read.'
  } catch (caughtError) {
    messageTone.value = 'error'
    message.value =
      caughtError instanceof Error ? caughtError.message : 'Could not mark the notification as read.'
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>
