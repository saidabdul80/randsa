<template>
  <ion-page>
    <ion-header v-if="showHeader" class="ion-no-border">
      <ion-toolbar color="transparent">
        <div class="mx-auto max-w-6xl px-4 pb-2 pt-4 sm:px-6 lg:px-8">
          <div class="glass-panel flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">
            <div class="min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-700">
                RANDSA
                <span v-if="eyebrow" class="ml-2 text-mist dark:text-slate-300">{{ eyebrow }}</span>
              </p>
              <h1 class="mt-3 text-balance font-display text-2xl font-bold tracking-normal text-ink dark:text-white sm:text-3xl">
                {{ title }}
              </h1>
              <p v-if="description" class="mt-2 max-w-2xl text-sm leading-7 text-mist dark:text-slate-300">
                {{ description }}
              </p>
            </div>
            <div class="shrink-0">
              <slot name="headerAction" />
            </div>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div :class="contentClass">
        <slot />
      </div>
    </ion-content>

    <AppBottomNav v-if="showBottomNav" />
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/vue'

import AppBottomNav from '../navigation/AppBottomNav.vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    eyebrow?: string
    showBottomNav?: boolean
    showHeader?: boolean
    contentClass?: string
  }>(),
  {
    description: '',
    eyebrow: '',
    showBottomNav: true,
    showHeader: true,
    contentClass: 'mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8',
  },
)
</script>
