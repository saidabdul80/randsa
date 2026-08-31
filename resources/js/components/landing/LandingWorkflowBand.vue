<script setup lang="ts">
import type { LandingPageSection } from '@/types/domain';

defineProps<{
    items: LandingPageSection[];
}>();
</script>

<template>
    <section class="bg-zinc-950 text-white">
        <div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:py-16">
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">One platform</p>
                <h2 class="mt-3 text-3xl font-semibold tracking-normal">Built for properties and service renderers.</h2>
            </div>
            <div class="grid gap-4 md:grid-cols-3">
                <article v-for="item in items" :key="item.title" class="rounded-lg border border-white/12 bg-white/8 p-5">
                    <h3 class="text-base font-semibold">{{ item.title }}</h3>
                    <p class="mt-3 text-sm leading-6 text-white/68">{{ item.description }}</p>
                </article>
            </div>
        </div>
    </section>
</template>
