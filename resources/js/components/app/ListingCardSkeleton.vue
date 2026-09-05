<script setup lang="ts">
withDefaults(
    defineProps<{
        compact?: boolean;
    }>(),
    {
        compact: false,
    },
);
</script>

<template>
    <article
        class="overflow-hidden bg-white"
        :class="
            compact
                ? ''
                : 'rounded-2xl border border-slate-200 p-3 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.62)]'
        "
    >
        <div
            class="animate-pulse bg-slate-100"
            :class="
                compact
                    ? 'aspect-square rounded-md'
                    : 'aspect-[1.55] rounded-xl'
            "
        />
        <div
            :class="
                compact
                    ? 'space-y-2 px-1 pt-2 pb-2'
                    : 'space-y-4 px-1 pt-4 pb-1'
            "
        >
            <div class="space-y-2">
                <div class="h-3 w-20 animate-pulse rounded bg-orange-100" />
                <div class="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div
                    v-if="compact"
                    class="h-4 w-4/5 animate-pulse rounded bg-slate-100"
                />
            </div>
            <div v-if="!compact" class="space-y-2">
                <div class="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
            <div v-if="!compact" class="grid grid-cols-3 gap-3">
                <div v-for="index in 3" :key="index" class="space-y-2">
                    <div class="h-4 w-14 animate-pulse rounded bg-slate-200" />
                    <div class="h-3 w-12 animate-pulse rounded bg-slate-100" />
                </div>
            </div>
            <div
                class="h-5 animate-pulse rounded bg-orange-100"
                :class="compact ? 'w-24' : 'w-32'"
            />
        </div>
    </article>
</template>
