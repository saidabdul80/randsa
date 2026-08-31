<script setup lang="ts">
defineProps<{
    title: string;
    body: string;
    actionLabel?: string;
    actionHref?: string;
}>();
</script>

<template>
    <section class="border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <span class="mx-auto grid h-12 w-12 place-items-center rounded bg-zinc-950 text-sm font-semibold text-white">R</span>
        <h2 class="mt-4 text-xl font-semibold text-zinc-950">{{ title }}</h2>
        <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">{{ body }}</p>
        <a
            v-if="actionHref && actionLabel"
            :href="actionHref"
            class="mt-5 inline-flex rounded bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
            {{ actionLabel }}
        </a>
    </section>
</template>
