<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
    icon: Component;
    title: string;
    body: string;
}>();
</script>

<template>
    <article class="flex min-h-[76px] items-center gap-4 rounded-xl border border-slate-200 bg-white/88 px-4 py-3 shadow-[0_18px_45px_-4px_rgba(15,23,42,0.35)] backdrop-blur">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-900/25 text-emerald-900 ">
            <component :is="icon" class="h-5 w-5" stroke-width="2" />
        </span>
        <span class="min-w-0">
            <span class="block text-sm font-black text-slate-950">{{ title }}</span>
            <span class="mt-1 block text-xs leading-5 text-slate-600">{{ body }}</span>
        </span>
    </article>
</template>
