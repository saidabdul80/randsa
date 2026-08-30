<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import type { ResourceCollection } from '@/types/domain';

defineProps<{
    collection?: ResourceCollection<unknown>;
    label?: string;
}>();
</script>

<template>
    <nav v-if="collection?.links?.prev || collection?.links?.next" class="flex flex-col gap-3 rounded-[16px] border border-zinc-200 bg-white p-4 shadow-[0_14px_34px_-30px_rgb(15_23_42_/_0.5)] sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
        <p class="text-sm font-medium text-zinc-600">
            {{ label || 'Results' }}
            <span v-if="collection.meta?.from && collection.meta?.to" class="text-zinc-400">
                {{ collection.meta.from }}-{{ collection.meta.to }}
            </span>
        </p>

        <div class="flex gap-2">
            <Link
                v-if="collection.links.prev"
                :href="collection.links.prev"
                preserve-scroll
                class="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
                Previous
            </Link>
            <Link
                v-if="collection.links.next"
                :href="collection.links.next"
                preserve-scroll
                class="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
                Next
            </Link>
        </div>
    </nav>
</template>
