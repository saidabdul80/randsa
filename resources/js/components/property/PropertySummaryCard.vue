<script setup lang="ts">
import { computed } from 'vue';
import StatusBadge from '@/components/app/StatusBadge.vue';
import { listingLocation } from '@/lib/domain';
import type { PropertyRecord } from '@/types/domain';

const props = defineProps<{
    property: PropertyRecord;
}>();

function formatDate(value?: string | null): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

const listedDate = computed(() => formatDate(props.property.created_at));
const updatedDate = computed(() => (props.property.updated_at === props.property.created_at ? '' : formatDate(props.property.updated_at)));
const listingPulse = computed(() => {
    if (!props.property.is_available) {
        return 'This listing is currently unavailable for new enquiries.';
    }

    return 'Available for enquiries and inspection booking.';
});
</script>

<template>
    <section id="summary" class="rounded-[18px] border border-zinc-200 bg-white p-[22px] shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
        <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
                    {{ property.sub_category?.label || property.category?.label || 'Housing' }}
                </span>
                <StatusBadge :status="property.is_available ? 'Available' : 'Unavailable'" />
            </div>
            <h1 class="mt-4 max-w-3xl text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
                {{ property.title }}
            </h1>
            <p class="mt-3 flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-600">
                <span class="h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" aria-hidden="true" />
                <span class="truncate">{{ listingLocation(property) }}</span>
            </p>
        </div>

        <div class="mt-5 flex flex-wrap gap-3 border-y border-zinc-100 py-4 text-sm font-medium text-zinc-600">
            <span v-if="listedDate">Listed {{ listedDate }}</span>
            <span v-if="updatedDate">Updated {{ updatedDate }}</span>
            <span>{{ property.category?.label || 'Housing' }}</span>
            <span>{{ property.sub_category?.label || 'Property listing' }}</span>
        </div>

        <div class="mt-5 flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Listing pulse</p>
                <p class="mt-1 text-sm font-semibold text-zinc-950">{{ listingPulse }}</p>
            </div>
            <span class="inline-flex w-max rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
                Trusted listing
            </span>
        </div>
    </section>
</template>
