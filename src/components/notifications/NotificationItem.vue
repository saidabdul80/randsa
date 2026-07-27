<template>
  <article
    class="group relative px-4 py-5 transition sm:px-5"
    :class="
      notification.readAt
        ? 'bg-white hover:bg-slate-50/70 dark:bg-slate-900 dark:hover:bg-slate-800/60'
        : 'bg-brand-50/45 hover:bg-brand-50/70 dark:bg-brand-500/[0.06] dark:hover:bg-brand-500/[0.10]'
    "
  >
    <span
      v-if="!notification.readAt"
      class="absolute left-0 top-8 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-brand-600 ring-4 ring-white dark:ring-slate-900"
      aria-hidden="true"
    />

    <div class="flex min-w-0 items-start gap-3 sm:gap-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
        :class="toneClasses.icon"
        aria-hidden="true"
      >
        <IonIcon :icon="notificationIcon" class="text-xl sm:text-2xl" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-bold leading-6 text-ink dark:text-white sm:text-base">
                {{ notification.title }}
              </h3>
              <span
                v-if="!notification.readAt"
                class="rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200"
              >
                New <span class="sr-only">unread notification</span>
              </span>
            </div>
            <p class="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {{ notification.body }}
            </p>
          </div>
          <time
            :datetime="notification.createdAt"
            class="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500"
          >
            {{ formattedDate }}
          </time>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="rounded-md px-2.5 py-1 text-[11px] font-semibold" :class="toneClasses.badge">
            {{ typeLabel }}
          </span>
          <span
            class="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {{ channelLabel }}
          </span>
          <button
            v-if="!notification.readAt"
            type="button"
            class="ml-0 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            :disabled="loading"
            @click="$emit('mark-read', notification.id)"
          >
            <IonIcon :icon="checkmarkOutline" aria-hidden="true" />
            Mark read
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  browsersOutline,
  calendarClearOutline,
  cardOutline,
  cashOutline,
  checkmarkOutline,
  megaphoneOutline,
} from 'ionicons/icons'
import { computed } from 'vue'

import type { NotificationRecord } from '../../types/notification'
import { formatNotificationTypeLabel } from '../../types/notification'

const props = defineProps<{
  notification: NotificationRecord
  loading?: boolean
}>()

defineEmits<{
  'mark-read': [notificationId: string]
}>()

const iconMap = {
  inspection_reminder: calendarClearOutline,
  booking_confirmation: calendarClearOutline,
  payment_confirmation: cardOutline,
  rent_due_reminder: cashOutline,
  admin_message: megaphoneOutline,
}

const toneMap = {
  inspection_reminder: {
    icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  },
  booking_confirmation: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
  payment_confirmation: {
    icon: 'bg-blue-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    badge: 'bg-blue-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200',
  },
  rent_due_reminder: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  },
  admin_message: {
    icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
}

const notificationIcon = computed(() =>
  props.notification.channel === 'browser' ? browsersOutline : iconMap[props.notification.type]
)
const toneClasses = computed(() => toneMap[props.notification.type])
const typeLabel = computed(() => formatNotificationTypeLabel(props.notification.type))
const channelLabel = computed(() => props.notification.channel.replace('_', ' '))
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(props.notification.createdAt))
)
</script>
