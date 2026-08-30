<script setup lang="ts">
defineProps<{
    facts: Array<{ label: string; value?: string | number | null }>;
}>();
</script>

<template>
    <dl class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="fact in facts" :key="fact.label" class="border border-zinc-200 bg-white p-4">
            <dt class="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">{{ fact.label }}</dt>
            <dd class="mt-2 text-base font-semibold text-zinc-950">{{ fact.value || 'Not specified' }}</dd>
        </div>
    </dl>
</template>
