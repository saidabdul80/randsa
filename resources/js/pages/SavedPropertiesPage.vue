<script setup lang="ts">
import AppLayout from '@/components/app/AppLayout.vue';
import EmptyState from '@/components/app/EmptyState.vue';
import ListingCard from '@/components/app/ListingCard.vue';
import PaginationControls from '@/components/app/PaginationControls.vue';
import { collection } from '@/lib/domain';
import type { ResourceCollection, SavedItem } from '@/types/domain';

const props = defineProps<{
    savedItems?: ResourceCollection<SavedItem>;
}>();
</script>

<template>
    <AppLayout title="Saved listings" eyebrow="Shortlist">
        <div class="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:pb-10">
            <div v-if="collection(props.savedItems).length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <template v-for="saved in collection(props.savedItems)" :key="saved.id">
                    <ListingCard v-if="saved.property" :item="saved.property" source="property" />
                    <ListingCard v-else-if="saved.marketplace_listing" :item="saved.marketplace_listing" source="listing" />
                </template>
            </div>
            <EmptyState v-else title="Nothing saved yet" body="Saved properties and service listings will appear here for quick follow-up." action-label="Browse listings" action-href="/" />
            <PaginationControls :collection="savedItems" label="Saved listings" class="mt-5" />
        </div>
    </AppLayout>
</template>
