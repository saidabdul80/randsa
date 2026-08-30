<script setup lang="ts">
import type { ServiceSubCategory } from '@/types/domain';

defineProps<{
    subCategory?: ServiceSubCategory;
    processing: boolean;
    canSubmit: boolean;
    isEditing: boolean;
}>();
</script>

<template>
    <section class="rounded-[18px] border border-zinc-200 bg-white p-5 shadow-[0_16px_36px_-34px_rgb(15_23_42_/_0.46)]">
        <h2 class="text-base font-semibold">Publishing rules</h2>
        <dl class="mt-3 space-y-2 text-sm">
            <div class="flex justify-between gap-4">
                <dt class="text-zinc-500">Target table</dt>
                <dd class="font-medium">{{ subCategory?.default_listing_table || 'marketplace_listings' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
                <dt class="text-zinc-500">Moderation</dt>
                <dd class="font-medium">{{ subCategory?.requires_moderation ? 'Required' : 'Not required' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
                <dt class="text-zinc-500">Bookable</dt>
                <dd class="font-medium">{{ subCategory?.is_bookable ? 'Yes' : 'No' }}</dd>
            </div>
        </dl>
        <button type="submit" class="mt-5 w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60" :disabled="processing || !canSubmit">
            {{ processing ? 'Saving...' : isEditing ? 'Save changes' : 'Submit listing' }}
        </button>
    </section>
</template>
