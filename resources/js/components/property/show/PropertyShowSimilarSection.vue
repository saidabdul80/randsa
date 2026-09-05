<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';
import ListingCard from '@/components/app/ListingCard.vue';
import QuickBookingModal from '@/components/landing/QuickBookingModal.vue';
import { collection } from '@/lib/domain';
import type { CollectionLike, PropertyRecord } from '@/types/domain';

type SimilarPropertyEntry = {
    source: 'property';
    item: PropertyRecord;
};

const props = defineProps<{
    items?: CollectionLike<PropertyRecord>;
}>();

const records = computed(() => collection(props.items).slice(0, 5));
const selectedBookingEntry = ref<SimilarPropertyEntry | null>(null);

function openBookingModal(item: PropertyRecord): void {
    selectedBookingEntry.value = {
        source: 'property',
        item,
    };
}
</script>

<template>
    <section v-if="records.length" class="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.58)]">
        <header class="flex items-center justify-between gap-4">
            <h2 class="font-serif text-2xl font-bold tracking-normal text-slate-950">Similar properties you might like</h2>
            <Link href="/#listings" class="hidden text-sm font-bold text-emerald-900 sm:inline-flex">View all properties</Link>
        </header>

        <div class="mt-6 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
            <ListingCard
                v-for="item in records"
                :key="item.id"
                source="property"
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
