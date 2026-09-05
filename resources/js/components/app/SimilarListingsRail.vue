<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import ListingCard from '@/components/app/ListingCard.vue';
import QuickBookingModal from '@/components/landing/QuickBookingModal.vue';
import { collection } from '@/lib/domain';
import type { CollectionLike, MarketplaceListing, PropertyRecord } from '@/types/domain';

type SimilarListingEntry = {
    source: 'property' | 'listing';
    item: PropertyRecord | MarketplaceListing;
};

const props = withDefaults(
    defineProps<{
        title: string;
        eyebrow?: string;
        description?: string;
        items?: CollectionLike<PropertyRecord | MarketplaceListing>;
        source: 'property' | 'listing';
    }>(),
    {
        eyebrow: 'Continue exploring',
        description: '',
    },
);

const records = computed(() => collection(props.items).slice(0, 8));
const selectedBookingEntry = ref<SimilarListingEntry | null>(null);

function openBookingModal(item: PropertyRecord | MarketplaceListing): void {
    selectedBookingEntry.value = {
        source: props.source,
        item,
    };
}
</script>

<template>
    <section v-if="records.length" class="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.55)] sm:p-6">
        <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">{{ eyebrow }}</p>
                <h2 class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950">{{ title }}</h2>
                <p v-if="description" class="mt-1 text-sm text-zinc-500">{{ description }}</p>
            </div>
            <Link href="/#listings" class="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
        </header>

        <div class="mt-6 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
            <ListingCard
                v-for="item in records"
                :key="`${props.source}-${item.id}`"
                :source="props.source"
                :item="item"
                compact
                @book="openBookingModal(item)"
            />
        </div>

        <QuickBookingModal
            :open="Boolean(selectedBookingEntry)"
            :entry="selectedBookingEntry"
            @close="selectedBookingEntry = null"
        />
    </section>
</template>
