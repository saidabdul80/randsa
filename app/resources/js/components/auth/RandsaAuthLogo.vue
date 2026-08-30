<script setup lang="ts">
withDefaults(
    defineProps<{
        centered?: boolean;
        compact?: boolean;
    }>(),
    {
        centered: false,
        compact: false,
    },
);
</script>

<template>
    <div class="flex items-center gap-3" :class="centered ? 'justify-center' : ''">
        <span
            class="grid shrink-0 place-items-center rounded-lg bg-emerald-900 text-white shadow-[0_14px_32px_-22px_rgba(6,78,59,0.9)]"
            :class="compact ? 'h-9 w-9' : 'h-12 w-12'"
        >
            <svg :class="compact ? 'h-5 w-5' : 'h-6 w-6'" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <path d="M6 12.15 14 5.8l8 6.35v10.1a1 1 0 0 1-1 1h-4.7v-6.2h-4.6v6.2H7a1 1 0 0 1-1-1v-10.1Z" fill="currentColor" opacity=".96" />
                <path d="M9.7 12.4 14 9l4.3 3.4v10.85h-2v-6.2h-4.6v6.2h-2V12.4Z" fill="white" />
            </svg>
        </span>
        <span class="leading-none">
            <span class="block font-black uppercase tracking-[0.08em] text-emerald-900" :class="compact ? 'text-lg' : 'text-[30px]'">RANDSA</span>
            <span class="mt-1 block text-[11px] font-black uppercase tracking-[0.34em] text-emerald-900">Properties</span>
        </span>
    </div>
</template>
