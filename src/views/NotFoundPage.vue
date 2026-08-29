<template>
  <AppShell content-class="app-shell__content not-found">
    <p class="rd-eyebrow"><span class="rd-rule" aria-hidden="true"></span>Error 404</p>

    <h1 class="rd-display not-found__title">This page has moved on.</h1>

    <p class="rd-lede not-found__lede">
      The link may be out of date, or the listing it pointed to is no longer published. Everything
      still available is one step away.
    </p>

    <div class="not-found__actions">
      <RouterLink to="/home" class="rd-cta">Browse the marketplace</RouterLink>
      <button type="button" class="rd-cta rd-cta--ghost" @click="goBack">Go back</button>
    </div>

    <hr class="rd-hairline not-found__rule" />

    <nav class="not-found__links" aria-label="Popular destinations">
      <p class="rd-meta">Popular destinations</p>
      <ul>
        <li v-for="item in suggestions" :key="item.to">
          <RouterLink :to="item.to" class="rd-link">{{ item.label }}</RouterLink>
        </li>
      </ul>
    </nav>
  </AppShell>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'

const router = useRouter()

const suggestions = [
  { label: 'All listings', to: '/home#listings' },
  { label: 'Post a listing', to: '/post-listing' },
  { label: 'My bookings', to: '/my-bookings' },
  { label: 'Saved listings', to: '/saved-properties' },
  { label: 'Account centre', to: '/profile' },
]

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/home')
}
</script>

<style scoped>
.not-found {
  display: flex;
  min-height: 70vh;
  flex-direction: column;
  justify-content: center;
  max-width: 720px;
}

.not-found__title {
  margin-top: 24px;
  font-size: clamp(34px, 5vw, 60px);
}

.not-found__lede {
  max-width: 520px;
  margin: 22px 0 0;
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.not-found__rule {
  margin: 44px 0 26px;
}

.not-found__links ul {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 26px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
}

@media (max-width: 680px) {
  .not-found__actions .rd-cta {
    width: 100%;
  }
}
</style>
