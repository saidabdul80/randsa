<template>
  <AppShell
    eyebrow="Welcome"
    title="Find better spaces with RANDSA"
    description="A calm entry point for browsing rentals, saving listings, booking inspections, and managing property activity."
    :show-bottom-nav="false"
  >
    <section class="grid flex-1 place-items-center py-10">
      <div class="glass-panel w-full max-w-xl overflow-hidden p-8 text-center sm:p-10">
        <div
          class="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-brand-600 font-display text-3xl font-bold text-white shadow-lg shadow-brand-500/30"
        >
          R
        </div>
        <h2 class="page-heading mt-6">RANDSA</h2>
        <p class="mx-auto mt-4 max-w-md text-sm leading-7 text-mist dark:text-slate-300">
          House rent, shop rent, offices, flats, duplexes, and more in one mobile-first experience.
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <RouterLink
            to="/onboarding"
            class="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Continue
          </RouterLink>
          <RouterLink
            to="/login"
            class="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Sign in
          </RouterLink>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'
</script>
