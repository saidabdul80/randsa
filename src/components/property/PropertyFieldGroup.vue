<template>
  <section class="rounded-[28px] border border-slate-200 bg-white/75 p-5 dark:border-slate-800 dark:bg-slate-900/60">
    <div class="flex flex-col gap-1">
      <h3 class="text-lg font-bold text-ink dark:text-white">{{ title }}</h3>
      <p v-if="description" class="text-sm leading-6 text-mist dark:text-slate-300">
        {{ description }}
      </p>
    </div>
    <div class="mt-5">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>
