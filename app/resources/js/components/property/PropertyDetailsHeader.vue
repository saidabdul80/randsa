<script setup lang="ts">
import { Link } from '@inertiajs/vue3';

defineProps<{
    title: string;
    kindLabel?: string;
    exploreHref?: string;
    exploreLabel?: string;
}>();

defineEmits<{
    back: [];
    save: [];
    share: [];
}>();
</script>

<template>
    <header class="flex flex-col gap-4 border-b border-zinc-200 bg-white/85 px-4 py-4 backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 items-center gap-3">
            <button
                type="button"
                class="grid h-10 w-10 flex-none place-items-center rounded-full border border-zinc-200 bg-white text-lg font-semibold text-zinc-800 transition hover:-translate-x-0.5 hover:bg-zinc-50"
                aria-label="Go back"
                @click="$emit('back')"
            >
                <span aria-hidden="true">&lt;</span>
            </button>
            <nav class="min-w-0 text-sm font-medium text-zinc-500" aria-label="Breadcrumb">
                <Link href="/" class="hover:text-zinc-950">Home</Link>
                <span class="mx-2 text-zinc-300">/</span>
                <Link :href="exploreHref || '/properties'" class="hover:text-zinc-950">{{ exploreLabel || 'Explore' }}</Link>
                <span class="mx-2 text-zinc-300">/</span>
                <span class="text-zinc-900">{{ kindLabel || 'Property details' }}</span>
                <p class="mt-1 truncate text-xs text-zinc-400">{{ title }}</p>
            </nav>
        </div>

        <div class="flex items-center gap-2">
            <button
                type="button"
                class="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-lg text-zinc-800 transition hover:-translate-y-0.5 hover:bg-zinc-50"
                aria-label="Save property"
                @click="$emit('save')"
            >
                <span aria-hidden="true">♡</span>
            </button>
            <button
                type="button"
                class="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-sm font-bold text-zinc-800 transition hover:-translate-y-0.5 hover:bg-zinc-50"
                aria-label="Share property"
                @click="$emit('share')"
            >
                <span aria-hidden="true">↗</span>
            </button>
        </div>
    </header>
</template>
