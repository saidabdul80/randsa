<script setup lang="ts">
import StatusBadge from './StatusBadge.vue';

defineProps<{
    title: string;
    subtitle?: string;
    meta?: string;
    status?: string | null;
}>();
</script>

<template>
    <article class="flex flex-col gap-3 rounded-[16px] border border-zinc-200 bg-white p-4 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
            <p class="text-base font-semibold text-zinc-950">{{ title }}</p>
            <p v-if="subtitle" class="mt-1 text-sm text-zinc-600">{{ subtitle }}</p>
            <p v-if="meta" class="mt-1 text-xs text-zinc-500">{{ meta }}</p>
        </div>
        <slot name="actions">
            <StatusBadge v-if="status" :status="status" />
        </slot>
    </article>
</template>
