<script setup lang="ts">
import { computed } from 'vue';
import { statusLabel } from '@/lib/domain';

const props = defineProps<{
    status?: string | null;
}>();

const tone = computed(() => {
    const value = props.status ?? '';

    if (['active', 'approved', 'success', 'completed'].includes(value)) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    }

    if (['pending', 'pending_review'].includes(value)) {
        return 'border-amber-200 bg-amber-50 text-amber-800';
    }

    if (['rejected', 'cancelled', 'expired'].includes(value)) {
        return 'border-rose-200 bg-rose-50 text-rose-800';
    }

    return 'border-zinc-200 bg-zinc-50 text-zinc-700';
});
</script>

<template>
    <span class="inline-flex items-center rounded border px-2.5 py-1 text-xs font-medium" :class="tone">
        {{ statusLabel(status) }}
    </span>
</template>
