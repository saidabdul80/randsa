<script setup lang="ts">
import EmptyState from '@/components/app/EmptyState.vue';
import ListingCard from '@/components/app/ListingCard.vue';
import ListingCardSkeleton from '@/components/app/ListingCardSkeleton.vue';
import QuickBookingModal from '@/components/landing/QuickBookingModal.vue';
import type { MarketplaceListing, PropertyRecord } from '@/types/domain';
import { ref } from 'vue';

type LandingListingEntry = {
    source: 'property' | 'listing';
    item: PropertyRecord | MarketplaceListing;
};

defineProps<{
    listings: LandingListingEntry[];
    resultCount: number;
    hasMore: boolean;
    hasFilters: boolean;
    loading?: boolean;
    loadingMore?: boolean;
    error?: string;
}>();

defineEmits<{
    clear: [];
    next: [];
}>();

const selectedBookingEntry = ref<LandingListingEntry | null>(null);

function openBookingModal(entry: LandingListingEntry) {
    selectedBookingEntry.value = entry;
}
</script>

<template>
    <section id="listings" class="bg-white">
        <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
            <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p
                        class="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase"
                    >
                        The marketplace
                    </p>
                    <h2
                        class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl"
                    >
                        Available homes, sales, rentals, and services
                    </h2>
                </div>
                <div class="flex items-center gap-3">
                    <p
                        class="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-700"
                        aria-live="polite"
                    >
                        Showing {{ resultCount }} result{{
                            resultCount === 1 ? '' : 's'
                        }}
                    </p>
                    <button
                        v-if="hasFilters"
                        type="button"
                        class="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                        :disabled="loading || loadingMore"
                        @click="$emit('clear')"
                    >
                        Clear filters
                    </button>
                </div>
            </div>

            <div
                v-if="loading && !listings.length"
                class="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5"
                aria-label="Loading listings"
            >
                <ListingCardSkeleton
                    v-for="index in 10"
                    :key="`initial-skeleton-${index}`"
                    compact
                />
            </div>

            <div
                v-else-if="listings.length"
                class="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5"
            >
                <ListingCard
                    v-for="entry in listings"
                    :key="`${entry.source}:${entry.item.id}`"
                    :source="entry.source"
                    :item="entry.item"
                    compact
                    @book="openBookingModal(entry)"
                />
            </div>

            <EmptyState
                v-else
                title="No listings match this search"
                body="Clear the filters or try a broader location, category, or price range."
                action-label="Post a listing"
                action-href="/post-listing"
            />

            <div
                v-if="loadingMore"
                class="mt-4 grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5"
                aria-label="Loading more listings"
            >
                <ListingCardSkeleton
                    v-for="index in 5"
                    :key="`more-skeleton-${index}`"
                    compact
                />
            </div>

            <div
                v-if="error"
                class="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
            >
                {{ error }}
            </div>

            <div
                v-if="listings.length"
                class="mt-8 flex flex-col items-center gap-3"
            >
                <button
                    v-if="hasMore"
                    type="button"
                    class="inline-flex min-w-52 items-center justify-center gap-2 rounded-md bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-zinc-400"
                    :disabled="loading || loadingMore"
                    @click="$emit('next')"
                >
                    <span
                        v-if="loadingMore"
                        class="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                        aria-hidden="true"
                    />
                    {{ loadingMore ? 'Loading more' : 'Load more results' }}
                </button>
                <p
                    v-else
                    class="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600"
                >
                    You have reached the end of the available results.
                </p>
            </div>

            <QuickBookingModal
                :open="Boolean(selectedBookingEntry)"
                :entry="selectedBookingEntry"
                @close="selectedBookingEntry = null"
            />
        </div>
    </section>
</template>
