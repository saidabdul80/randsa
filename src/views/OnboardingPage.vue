<template>
  <AppShell
    eyebrow="Welcome"
    title="A smoother way to rent and list properties"
    description="Start with the role that fits you, then move through discovery, booking, payment, and account tools with less friction."
    :show-bottom-nav="false"
  >
    <section class="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div class="glass-panel overflow-hidden p-8 sm:p-10">
        <div
          class="inline-flex rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
        >
          Modern property browsing
        </div>
        <h2 class="page-heading mt-5">
          Browse homes, shops, offices, and apartments with confidence.
        </h2>
        <p class="mt-4 max-w-2xl text-sm leading-7 text-mist dark:text-slate-300">
          RANDSA brings rental search, listing management, inspection booking, and trust workflows
          into one mobile-friendly experience.
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <RouterLink
            to="/register"
            class="rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Create account
          </RouterLink>
          <RouterLink
            to="/home"
            class="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Skip for now
          </RouterLink>
        </div>
      </div>

      <div class="grid gap-4">
        <article v-for="item in onboardingItems" :key="item.title" class="glass-panel p-6">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">{{ item.tag }}</p>
          <h3 class="mt-3 text-lg font-bold text-ink dark:text-white">{{ item.title }}</h3>
          <p class="mt-2 text-sm leading-7 text-mist dark:text-slate-300">{{ item.copy }}</p>
        </article>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'

const onboardingItems = [
  {
    tag: 'Discover',
    title: 'Location-first search',
    copy: 'Users will explore listings by city, area, and property type with a mobile-friendly search flow.',
  },
  {
    tag: 'Trust',
    title: 'Verified professionals',
    copy: 'Agent profiles can submit documents for admin review so tenants see clearer trust signals.',
  },
  {
    tag: 'Action',
    title: 'Quick booking paths',
    copy: 'Booking, payment, and saved property routes stay close to every listing decision.',
  },
]
</script>
